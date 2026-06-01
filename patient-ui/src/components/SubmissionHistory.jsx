import React, { useState, useEffect } from 'react';
import { getAllSubmissions } from '../utils/storage';
import { syncPendingSubmissions } from '../utils/syncQueue';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const SubmissionHistory = () => {
  const [submissions, setSubmissions] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isOnline = useNetworkStatus();

  const loadSubmissions = async () => {
    try {
      // 1. Fetch synced submissions from the backend API
      let serverSubmissions = [];
      if (isOnline) {
        try {
          const res = await fetch(`${API_URL}/patient/submissions`);
          if (res.ok) {
            const serverData = await res.json();
            // Normalize server submissions to match local format for display
            serverSubmissions = serverData.map((s) => ({
              id: `server-${s.id}`,
              formTitle: `Submission #${s.id}`,
              timestamp: s.submitted_at,
              syncStatus: 'SYNCED',
            }));
          }
        } catch (e) {
          console.warn('Could not fetch server submissions:', e);
        }
      }

      // 2. Get local submissions (PENDING / FAILED only — don't double-show synced)
      const localData = await getAllSubmissions();
      const localPending = localData.filter(
        (s) => s.syncStatus === 'PENDING' || s.syncStatus === 'FAILED'
      );

      // 3. Merge: local pending first, then server-synced
      const merged = [
        ...localPending,
        ...serverSubmissions,
      ];

      setSubmissions(merged);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
    const interval = setInterval(loadSubmissions, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const handleSyncNow = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    await syncPendingSubmissions();
    await loadSubmissions();
    setIsSyncing(false);
  };

  const pendingCount = submissions.filter(
    (s) => s.syncStatus === 'PENDING' || s.syncStatus === 'FAILED'
  ).length;

  return (
    <div className="bg-white rounded-lg shadow p-4 max-w-2xl mx-auto my-4">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h2 className="text-xl font-bold text-gray-800">Submission History</h2>

        {pendingCount > 0 && (
          <div className="flex items-center space-x-3">
            <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {pendingCount} Pending Sync
            </span>
            <button
              onClick={handleSyncNow}
              disabled={!isOnline || isSyncing}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                !isOnline
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No recent submissions.</p>
      ) : (
        <ul className="space-y-3">
          {submissions.map((sub) => (
            <li key={sub.id} className="flex flex-col border rounded p-3 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{sub.formTitle}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(sub.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  {sub.syncStatus === 'SYNCED' && (
                    <span className="flex items-center text-green-600 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Synced
                    </span>
                  )}
                  {sub.syncStatus === 'PENDING' && (
                    <span className="flex items-center text-orange-600 text-sm font-medium">
                      <Clock className="w-4 h-4 mr-1" /> Pending
                    </span>
                  )}
                  {sub.syncStatus === 'FAILED' && (
                    <span className="flex items-center text-red-600 text-sm font-medium" title={sub.errorMessage}>
                      <AlertCircle className="w-4 h-4 mr-1" /> Failed (Retry {sub.retryCount})
                    </span>
                  )}
                </div>
              </div>
              {sub.syncStatus === 'FAILED' && sub.errorMessage && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                  {sub.errorMessage}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
