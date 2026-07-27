import { getAllSubmissions, updateSubmission, removeSubmission } from './storage';

/**
 * Trigger sync process for all pending submissions.
 */
export const syncPendingSubmissions = async () => {
  const submissions = await getAllSubmissions();
  const pendingOrFailed = submissions.filter(
    (s) => s.syncStatus === 'PENDING' || s.syncStatus === 'FAILED'
  );

  if (pendingOrFailed.length === 0) return;

  for (const submission of pendingOrFailed) {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

      // Security: never trust a URL stored in the submission object.
      // Validate formId is a safe integer and derive the endpoint from it.
      const numericFormId = parseInt(submission.formId, 10);
      if (isNaN(numericFormId) || numericFormId <= 0) {
        await updateSubmission(submission.id, {
          syncStatus: 'FAILED',
          errorMessage: 'Invalid formId — submission skipped',
        });
        continue;
      }
      const endpointUrl = `${API_URL}/patient/forms/${numericFormId}/submissions`;

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: submission.payload })
      });
      
      if (!response.ok) {
        throw new Error('Sync failed with status ' + response.status);
      }
      
      // Mark as synced
      await updateSubmission(submission.id, { syncStatus: 'SYNCED', errorMessage: null });

    } catch (error) {
      console.error(`Failed to sync submission ${submission.id}:`, error);
      await updateSubmission(submission.id, {
        syncStatus: 'FAILED',
        errorMessage: error.message,
        retryCount: submission.retryCount + 1
      });
    }
  }
};
