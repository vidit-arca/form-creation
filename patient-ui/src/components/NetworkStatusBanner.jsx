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

  const showOffline = !isOnline;
  const showStorage = supported && isLow;

  if (!showOffline && !showStorage) return null;

  return (
    <div className="sticky top-0 z-50 flex flex-col w-full text-xs font-mono">
      {/* ── Offline Banner ─────────────────────────────────────────── */}
      {showOffline && (
        <div className="w-full bg-slate-900 text-amber-300 border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-2 shadow-sm">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-sans font-semibold">
            Offline Encrypted Mode
          </span>
          <span className="text-slate-400">·</span>
          <span className="font-sans text-slate-300">
            Forms are securely cached in local storage and will automatically synchronize upon reconnection.
          </span>
        </div>
      )}

      {/* ── Storage Warning Banner ──────────────────────────────────── */}
      {showStorage && (
        <div
          className={`w-full px-4 py-2 border-b flex items-center justify-center gap-2 shadow-sm ${
            isCritical
              ? 'bg-rose-950 text-rose-200 border-rose-800'
              : 'bg-amber-950 text-amber-200 border-amber-800'
          }`}
        >
          {isCritical ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          ) : (
            <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span className="font-sans font-semibold">
            {isCritical
              ? `Critical Vault Storage (${percentUsed}% — ${formatBytes(usage)} of ${formatBytes(quota)} used)`
              : `Storage Warning (${percentUsed}% — ${formatBytes(usage)} of ${formatBytes(quota)} used)`}
          </span>
          <span className="opacity-60">·</span>
          <span className="font-sans text-xs opacity-90">
            {isCritical
              ? 'Synchronize or clear past submissions immediately to prevent data drop.'
              : 'Submit or synchronize local forms soon to maintain vault headroom.'}
          </span>

          {/* Visual progress bar */}
          <div className="hidden sm:flex items-center gap-2 ml-3 shrink-0">
            <div className="w-20 h-1.5 rounded-full bg-black/40 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCritical ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
            <span className="font-mono text-[10px] font-bold">{percentUsed}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
