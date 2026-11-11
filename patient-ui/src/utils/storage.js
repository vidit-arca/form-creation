import localforage from 'localforage';

// 1. Storage for available forms
export const formCacheStore = localforage.createInstance({
  name: "HaloFormCraft",
  storeName: "cached_forms"
});

// 2. Queue for offline submissions
export const submissionQueueStore = localforage.createInstance({
  name: "HaloFormCraft",
  storeName: "submission_queue"
});

// 3. User & Session tracking
export const sessionStore = localforage.createInstance({
  name: "HaloFormCraft",
  storeName: "user_session"
});

// --- CRUD Helpers for Submission Queue ---

/**
 * Add a new submission to the offline queue.
 * @param {Object} submissionData
 */
export const addSubmissionToQueue = async (submissionData) => {
  const id = submissionData.id || crypto.randomUUID();
  const submission = {
    ...submissionData,
    id,
    timestamp: submissionData.timestamp || new Date().toISOString(),
    syncStatus: 'PENDING',
    retryCount: 0,
    nextRetryAt: 0,
    lastAttemptAt: null,
    errorMessage: null
  };
  await submissionQueueStore.setItem(id, submission);
  return submission;
};

/**
 * Get all queued submissions.
 * @returns {Promise<Array>} Array of submissions
 */
export const getAllSubmissions = async () => {
  const submissions = [];
  await submissionQueueStore.iterate((value) => {
    submissions.push(value);
  });
  // Sort by timestamp descending
  return submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/**
 * Get a specific submission by ID.
 * @param {string} id
 */
export const getSubmissionById = async (id) => {
  return await submissionQueueStore.getItem(id);
};

/**
 * Update an existing submission (e.g., status updates).
 * @param {string} id
 * @param {Object} updates
 */
export const updateSubmission = async (id, updates) => {
  const existing = await submissionQueueStore.getItem(id);
  if (existing) {
    const updated = { ...existing, ...updates };
    await submissionQueueStore.setItem(id, updated);
    return updated;
  }
  return null;
};

/**
 * Remove a submission from the queue (e.g., after successful sync).
 * @param {string} id
 */
export const removeSubmission = async (id) => {
  await submissionQueueStore.removeItem(id);
};

// 4. Local drafts storage
export const draftsStore = localforage.createInstance({
  name: "HaloFormCraft",
  storeName: "saved_drafts"
});

/**
 * Save a new or existing draft locally.
 * @param {string|null} draftId 
 * @param {string} formId 
 * @param {string} formTitle 
 * @param {Object} answers 
 * @returns {Promise<string>} The saved draft's ID
 */
export const saveDraft = async (draftId, formId, formTitle, answers) => {
  const id = draftId || crypto.randomUUID();
  const draft = {
    id,
    formId,
    formTitle,
    timestamp: new Date().toISOString(),
    answers
  };
  await draftsStore.setItem(id, draft);
  return id;
};

/**
 * Get a specific draft by ID.
 * @param {string} id 
 * @returns {Promise<Object|null>} Draft object or null
 */
export const getDraft = async (id) => {
  return await draftsStore.getItem(id);
};

/**
 * Get all drafts sorted by timestamp descending.
 * @returns {Promise<Array>} Array of saved drafts
 */
export const getAllDrafts = async () => {
  const drafts = [];
  await draftsStore.iterate((value) => {
    drafts.push(value);
  });
  return drafts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/**
 * Delete a saved draft by ID.
 * @param {string} id 
 */
export const deleteDraft = async (id) => {
  await draftsStore.removeItem(id);
};

/**
 * Emergency Disaster Recovery Export:
 * Exports all pending, failed, and synced records + drafts directly from IndexedDB
 * as a timestamped JSON file that can be ingested manually or saved on external drives.
 */
export const exportOfflineLedger = async () => {
  const submissions = await getAllSubmissions();
  const drafts = await getAllDrafts();

  const ledger = {
    exportedAt: new Date().toISOString(),
    sourceApp: "HaloFormCraft-PWA",
    version: "2.5.0",
    summary: {
      totalSubmissions: submissions.length,
      pendingCount: submissions.filter(s => s.syncStatus === 'PENDING' || s.syncStatus === 'FAILED' || s.syncStatus === 'DLQ_REVIEW').length,
      syncedCount: submissions.filter(s => s.syncStatus === 'SYNCED').length,
      draftsCount: drafts.length
    },
    submissions,
    drafts
  };

  const jsonString = JSON.stringify(ledger, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `halo-offline-ledger-${dateStr}-${Date.now().toString().slice(-4)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return ledger;
};

/**
 * Clean up successfully synced submissions older than 7 days
 * to keep IndexedDB lean and fast.
 */
export const pruneSyncedSubmissions = async (maxAgeDays = 7) => {
  const submissions = await getAllSubmissions();
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  for (const sub of submissions) {
    if (sub.syncStatus === 'SYNCED') {
      const subTime = new Date(sub.timestamp).getTime();
      if (now - subTime > maxAgeMs) {
        await removeSubmission(sub.id);
      }
    }
  }
};

