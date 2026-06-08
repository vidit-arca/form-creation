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

