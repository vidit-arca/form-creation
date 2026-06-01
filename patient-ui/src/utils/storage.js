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
  const id = crypto.randomUUID();
  const submission = {
    ...submissionData,
    id,
    timestamp: new Date().toISOString(),
    syncStatus: 'PENDING',
    retryCount: 0,
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
