import React from 'react';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import { useStorageQuota } from '../utils/useStorageQuota';
import { WifiOff, HardDrive, AlertTriangle } from 'lucide-react';

/** Format bytes into a readable string, e.g. 84 MB or 1.2 GB */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i >= 2 ? 1 : 0)} ${units[i]}`;
}

export const NetworkStatusBanner = () => {
  const isOnline = useNetworkStatus();
  const { isLow, isCritical, percentUsed, usage, quota, supported } = useStorageQuota();

  // Determine which banners to render (can show both simultaneously)
  const showOffline  = !isOnline;
  const showStorage  = supported && isLow; // only show when >= 80%

  if (!showOffline && !showStorage) return null;

  return (
    <div className="sticky top-0 z-50 flex flex-col w-full">
      {/* ── Offline Banner ─────────────────────────────────────────── */}
      {showOffline && (
        <div className="w-full bg-orange-500 text-white px-4 py-2.5 shadow-md flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span className="font-semibold text-sm">
            ⚠️ Offline Mode — forms are saved locally and will sync when you reconnect.
          </span>
        </div>
      )}

      {/* ── Storage Warning Banner ──────────────────────────────────── */}
      {showStorage && (
        <div
          className={`w-full px-4 py-2.5 shadow-md flex items-center justify-center gap-2 ${
            isCritical
              ? 'bg-red-600 text-white'
              : 'bg-amber-400 text-amber-950'
          }`}
        >
          {isCritical ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <HardDrive className="w-4 h-4 shrink-0" />
          )}
          <span className="font-semibold text-sm">
            {isCritical
              ? `🚨 Storage critically full (${percentUsed}% — ${formatBytes(usage)} of ${formatBytes(quota)} used). Submit or clear old data immediately.`
              : `💾 Storage ${percentUsed}% full (${formatBytes(usage)} of ${formatBytes(quota)} used). Sync submissions to free space.`}
          </span>

          {/* Visual progress bar */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2 shrink-0">
            <div className="w-24 h-2 rounded-full bg-black/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-white' : 'bg-amber-700'}`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold opacity-80">{percentUsed}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
