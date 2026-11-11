import { getAllSubmissions, updateSubmission } from './storage';

let isSyncing = false;

/**
 * Calculates exponential backoff with full randomized jitter.
 * Prevents thundering-herd issues on recovering servers and saves device battery.
 * Range: 2s -> 4s -> 8s -> 16s -> 32s ... up to max 5 minutes.
 */
export const calculateBackoff = (retryCount) => {
  const baseMs = 2000;   // 2 seconds
  const maxMs = 300000;  // 5 minutes
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, Math.min(retryCount, 8)));
  const jitter = 0.5 + Math.random(); // 0.5x to 1.5x jitter
  return Math.round(exponential * jitter);
};

/**
 * Trigger sync process for all pending submissions.
 * @param {boolean} forceImmediate If true, bypasses backoff delay checks (user clicked Force Sync).
 * @returns {Promise<{ synced: number, failed: number, skipped: number }>}
 */
export const syncPendingSubmissions = async (forceImmediate = false) => {
  if (isSyncing) {
    console.log('[SyncQueue] Sync already in progress, skipping concurrent invocation.');
    return { synced: 0, failed: 0, skipped: 0 };
  }

  isSyncing = true;
  const stats = { synced: 0, failed: 0, skipped: 0 };

  try {
    const submissions = await getAllSubmissions();
    const pendingItems = submissions.filter(
      (s) => s.syncStatus === 'PENDING' || s.syncStatus === 'FAILED'
    );

    if (pendingItems.length === 0) {
      return stats;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    let consecutiveNetworkErrors = 0;
    const now = Date.now();

    for (const submission of pendingItems) {
      // 1. Backoff Check: If not forcing, honor the exponential backoff window
      if (!forceImmediate && submission.nextRetryAt && now < submission.nextRetryAt) {
        stats.skipped++;
        continue;
      }

      // 2. Circuit Breaker: If 3 consecutive requests failed from connection drop, pause to save battery
      if (consecutiveNetworkErrors >= 3) {
        console.warn('[SyncQueue] Circuit breaker tripped after 3 network failures. Pausing sync batch.');
        break;
      }

      // 3. Security & Validation check
      const numericFormId = parseInt(submission.formId, 10);
      if (isNaN(numericFormId) || numericFormId <= 0) {
        await updateSubmission(submission.id, {
          syncStatus: 'DLQ_REVIEW',
          errorMessage: 'Invalid formId — cannot dispatch',
          lastAttemptAt: new Date().toISOString()
        });
        stats.failed++;
        continue;
      }

      // 4. Preserve target URL with query params (project, site, center) if present
      let endpointUrl = submission.targetUrl;
      if (!endpointUrl || !endpointUrl.startsWith('http')) {
        endpointUrl = `${API_URL}/patient/forms/${numericFormId}/submissions`;
      }

      // 5. Mark as SYNCING in memory/storage
      await updateSubmission(submission.id, {
        syncStatus: 'SYNCING',
        lastAttemptAt: new Date().toISOString()
      });

      try {
        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': submission.id // Server idempotency header
          },
          body: JSON.stringify({
            data: submission.payload,
            client_submission_id: submission.id // Payload backup idempotency key
          })
        });

        if (response.ok) {
          // Success: 200 OK / 201 Created
          consecutiveNetworkErrors = 0;
          await updateSubmission(submission.id, {
            syncStatus: 'SYNCED',
            errorMessage: null,
            nextRetryAt: 0,
            syncedAt: new Date().toISOString()
          });
          stats.synced++;
        } else if (response.status === 400 || response.status === 422) {
          // Unrecoverable schema / validation error: Isolate to Dead Letter Queue (DLQ)
          const errBody = await response.text().catch(() => '');
          console.error(`[SyncQueue] Validation error for ${submission.id}:`, errBody);
          await updateSubmission(submission.id, {
            syncStatus: 'DLQ_REVIEW',
            errorMessage: `Validation failed (HTTP ${response.status}): ${errBody.slice(0, 150)}`,
            lastAttemptAt: new Date().toISOString()
          });
          stats.failed++;
        } else {
          // Server error (5xx, 502, 503, 504) -> Schedule exponential backoff retry
          throw new Error(`Server returned HTTP ${response.status}`);
        }
      } catch (err) {
        consecutiveNetworkErrors++;
        const newRetryCount = (submission.retryCount || 0) + 1;
        const backoffMs = calculateBackoff(newRetryCount);
        const nextRetryAt = Date.now() + backoffMs;

        console.warn(`[SyncQueue] Submission ${submission.id} failed (attempt ${newRetryCount}). Retrying in ${Math.round(backoffMs / 1000)}s:`, err.message);

        await updateSubmission(submission.id, {
          syncStatus: 'FAILED',
          errorMessage: err.message || 'Network connection failed',
          retryCount: newRetryCount,
          nextRetryAt,
          lastAttemptAt: new Date().toISOString()
        });
        stats.failed++;
      }
    }
  } finally {
    isSyncing = false;
  }

  return stats;
};
