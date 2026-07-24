import * as yup from 'yup';

/**
 * Yup schema for the haloform session context.
 * Enforces safe alphanumeric slugs only — blocks any attempt to
 * inject targetUrl or arbitrary keys into the context object.
 */
const contextSchema = yup.object({
  project: yup.string().matches(/^[A-Za-z0-9_-]{1,32}$/, 'Invalid project slug').optional().nullable(),
  site:    yup.string().matches(/^[A-Za-z0-9_-]{1,32}$/, 'Invalid site code').optional().nullable(),
  center:  yup.string().matches(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid center code').optional().nullable(),
}).noUnknown(true).strict();

const STORAGE_KEY = 'haloform_context';

/**
 * Read and validate the stored context from localStorage.
 * If the stored value is malformed or fails validation,
 * the entry is cleared and an empty object is returned.
 */
export const readContext = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return contextSchema.validateSync(raw, { stripUnknown: true }) || {};
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return {};
  }
};

/**
 * Validate and write context to localStorage.
 * Unknown keys and values that don't match the schema are stripped.
 */
export const writeContext = (ctx) => {
  try {
    const safe = contextSchema.validateSync(ctx, { stripUnknown: true });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  } catch {
    if (import.meta.env.DEV) {
      console.warn('[HaloForm] writeContext: invalid context, write rejected', ctx);
    }
  }
};

/**
 * Remove the stored context.
 */
export const clearContext = () => localStorage.removeItem(STORAGE_KEY);
