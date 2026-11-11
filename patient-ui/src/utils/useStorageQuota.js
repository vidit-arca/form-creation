import { useState, useEffect } from 'react';

/**
 * Returns the browser's storage quota estimate for this origin.
 *
 * @returns {{
 *   usage: number,        // bytes currently used
 *   quota: number,        // bytes allowed by the browser
 *   percentUsed: number,  // 0–100
 *   isLow: boolean,       // true when usage >= WARNING_THRESHOLD_PERCENT
 *   isCritical: boolean,  // true when usage >= CRITICAL_THRESHOLD_PERCENT
 *   supported: boolean,   // false on browsers that don't support the API
 * }}
 */

const WARNING_THRESHOLD_PERCENT  = 80;  // show amber warning banner
const CRITICAL_THRESHOLD_PERCENT = 95;  // show red critical banner
const POLL_INTERVAL_MS = 60_000;        // re-check every 60 seconds

export function useStorageQuota() {
  const supported = typeof navigator !== 'undefined' &&
                    !!navigator.storage?.estimate;

  const [quota, setQuota] = useState({
    usage: 0,
    quota: 0,
    percentUsed: 0,
    isLow: false,
    isCritical: false,
    supported,
  });

  useEffect(() => {
    if (!supported) return;

    const check = async () => {
      try {
        const { usage = 0, quota: q = 0 } = await navigator.storage.estimate();
        const percent = q > 0 ? Math.round((usage / q) * 100) : 0;
        setQuota({
          usage,
          quota: q,
          percentUsed: percent,
          isLow: percent >= WARNING_THRESHOLD_PERCENT,
          isCritical: percent >= CRITICAL_THRESHOLD_PERCENT,
          supported: true,
        });
      } catch (err) {
        console.warn('[useStorageQuota] estimate() failed:', err);
      }
    };

    check(); // run immediately on mount
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [supported]);

  return quota;
}
