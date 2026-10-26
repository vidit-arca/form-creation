# Offline Draft Persistence & Storage Resilience

## 1. Context & Problem Statement

### Real-World Field Scenario
In field deployments (e.g., healthcare workers visiting rural hospitals or remote clinics), devices often experience:
- Extended offline periods (e.g., 5+ days without network connectivity).
- Sudden power-offs and device restarts.
- Domain/link availability issues (e.g., reverse proxy or Cloudflare downtime).

### Observed Failure
During testing, forms were filled and saved locally, and the device was left offline for ~5 days. Upon reconnecting and bringing the application back up, the saved drafts were missing.

### Root Cause Analysis
1. **Best-Effort Browser Eviction (Primary Cause):**
   - IndexedDB storage defaults to **"best-effort"** persistence.
   - Mobile and desktop browsers (especially Safari/WebKit and Chromium on constrained devices) reserve the right to silently evict/prune IndexedDB databases if the origin hasn't been accessed for several days or when disk/battery constraints trigger cleanup.
   - Without an explicit call to `navigator.storage.persist()`, local databases are vulnerable to deletion during multi-day offline intervals.

2. **Absence of Auto-Save:**
   - Previously, form drafts were only saved when the user manually clicked **"Save Draft"**.
   - If a device shut down unexpectedly, ran out of battery, or crashed before a manual save, the in-progress form entries were entirely lost.

3. **Silent Quota Failures:**
   - Browsers allocate a dynamic storage quota. When quota thresholds are crossed, future write operations (`localforage.setItem`) fail, risking unannounced data loss for new form entries.

---

## 2. Implemented Solutions

To address these vulnerabilities, three distinct resilience mechanisms were implemented:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            App Initialization                                │
│                                                                              │
│  main.jsx ──▶ navigator.storage.persist() ──▶ Requests "Persistent" Storage  │
│                                               (Prevents silent eviction)     │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             Form Filling                                     │
│                                                                              │
│  App.jsx ──▶ 30s Auto-Save Timer ──▶ Overwrites active draft in IndexedDB    │
│              (Visual indicators: Saving... / Saved ✓)                         │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Storage Quota Monitoring                             │
│                                                                              │
│  useStorageQuota.js ──▶ Reads navigator.storage.estimate() every 60s         │
│  NetworkStatusBanner.jsx ──▶ Warns at 80% (Amber) & 95% (Red / Critical)      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Technical Changes

### Fix 1: Persistent Storage Registration
- **File Modified:** `patient-ui/src/main.jsx`
- **What Was Changed:**
  - Added an initialization check calling `navigator.storage.persist()`.
  - Upgrades origin storage mode from "best-effort" to "persistent".
- **Why We Did It:**
  - Informs the browser that data stored in IndexedDB (drafts, submission queue, cached form definitions) is critical and must not be evicted during idle cleanup or low disk scenarios.

```javascript
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((granted) => {
    if (granted) {
      console.log('[Storage] Persistent storage granted — data is safe from eviction.');
    } else {
      console.warn('[Storage] Persistent storage NOT granted. Add PWA to home screen to improve persistence.');
    }
  });
}
```

---

### Fix 2: Periodic Form Auto-Save
- **File Modified:** `patient-ui/src/App.jsx`
- **What Was Changed:**
  - Added a 30-second interval inside `FormRenderer`.
  - Validates that non-empty form inputs exist before writing.
  - Re-uses `activeDraftId` to prevent draft duplication across ticks.
  - Added UI feedback (`autoSaveStatus`: `saving` / `saved` with pulsing indicator) above the bottom navigation buttons.
- **Why We Did It:**
  - Prevents data loss if a device battery dies or the browser tab closes abruptly while the user is actively entering data.

---

### Fix 3: Storage Quota Monitoring & Alerting
- **Files Added / Modified:**
  - `patient-ui/src/utils/useStorageQuota.js` (New custom React hook)
  - `patient-ui/src/components/NetworkStatusBanner.jsx`
- **What Was Changed:**
  - `useStorageQuota`: Polls `navigator.storage.estimate()` every 60 seconds. Calculates current disk usage, total quota, and percentage.
  - `NetworkStatusBanner`:
    - Displays an amber warning at **≥ 80%** usage, prompting the user to sync completed forms.
    - Displays a critical red alert at **≥ 95%** usage with a progress bar and human-readable byte measurements (e.g., `84 MB of 100 MB used`).
- **Why We Did It:**
  - Prevents silent storage write failures on storage-constrained mobile hardware.

---

## 4. Verification & Testing Recommendations

1. **Persistent Storage Check:**
   - Open browser DevTools console on app launch.
   - Look for `[Storage] Persistent storage granted`.
   - In Chromium: Inspect `Application` -> `Storage` -> ensure `Storage quota` shows persistent storage enabled.

2. **Auto-Save Verification:**
   - Open a form, enter field values without clicking "Save Draft".
   - Wait 30 seconds -> Observe the `Auto-saving draft…` -> `Draft auto-saved ✓` status indicator.
   - Close/refresh the tab and visit `/drafts` -> Confirm the draft exists with recent values.

3. **Quota Warning Simulation:**
   - Test `useStorageQuota` thresholds to ensure warning banners render appropriately alongside offline indicators.
