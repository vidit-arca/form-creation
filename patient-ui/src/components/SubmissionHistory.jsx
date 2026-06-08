import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllSubmissions } from '../utils/storage';
import { syncPendingSubmissions } from '../utils/syncQueue';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import { RefreshCw, CheckCircle2, AlertCircle, Clock, Calendar, Check, AlertTriangle } from 'lucide-react';
import { NavBar } from './NavBar';

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
              formTitle: s.form_title || `Submission #${s.id}`,
              timestamp: s.submitted_at,
              syncStatus: 'SYNCED',
            }));
          }
        } catch (e) {
          console.warn('Could not fetch server submissions:', e);
        }
      }

      // 2. Get local submissions (PENDING / FAILED only)
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 font-sans">
      <NavBar />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Back Link */}
        <Link to="/forms" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-700 font-semibold mb-6 transition-colors">
          ← Back to Catalog
        </Link>

        {/* Title Block */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-8 mb-8 shadow-xl shadow-emerald-600/10 relative overflow-hidden text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-white rounded-full"></div>
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-100" />
                <h1 className="text-3xl font-extrabold tracking-tight">Submission History</h1>
              </div>
              <p className="text-emerald-100 mt-2 text-md max-w-xl leading-relaxed">
                Review your completed form submissions. When working offline, your forms are safely queued on your device and will sync automatically when your internet connection is restored.
              </p>
            </div>

            {/* Sync Now button block */}
            {pendingCount > 0 && (
              <div className="shrink-0 flex flex-col items-center sm:items-end gap-2 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-emerald-250 animate-pulse" /> {pendingCount} Pending Sync
                </span>
                <button
                  onClick={handleSyncNow}
                  disabled={!isOnline || isSyncing}
                  className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.97] cursor-pointer ${
                    !isOnline
                      ? 'bg-slate-100/30 text-slate-350 cursor-not-allowed border border-slate-200/20'
                      : 'bg-white text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-emerald-200 border-t-emerald-600"></div>
          </div>
        ) : submissions.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Submissions Yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">Complete a form from your catalog to see your submission history here.</p>
            <Link to="/forms" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all active:scale-95">
              Fill Out Form
            </Link>
          </div>
        ) : (
          /* Submissions List */
          <ul className="space-y-4">
            {submissions.map((sub) => {
              const formattedDate = new Date(sub.timestamp).toLocaleString();
              const isSynced = sub.syncStatus === 'SYNCED';
              const isPending = sub.syncStatus === 'PENDING';
              const isFailed = sub.syncStatus === 'FAILED';

              // Visual styling variables based on sync state
              let cardBorder = 'border-slate-200/60';
              let badgeBg = 'bg-slate-100 text-slate-700';
              let badgeLabel = 'Unknown';
              let icon = <Clock className="w-4 h-4" />;

              if (isSynced) {
                cardBorder = 'border-emerald-200/60 hover:border-emerald-300';
                badgeBg = 'bg-emerald-50 text-emerald-700';
                badgeLabel = 'Synced';
                icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
              } else if (isPending) {
                cardBorder = 'border-amber-200/60 hover:border-amber-300 animate-pulse';
                badgeBg = 'bg-amber-50 text-amber-800';
                badgeLabel = 'Pending Sync';
                icon = <Clock className="w-4 h-4 text-amber-600 animate-spin" />;
              } else if (isFailed) {
                cardBorder = 'border-rose-200/60 hover:border-rose-300';
                badgeBg = 'bg-rose-50 text-rose-800';
                badgeLabel = 'Failed';
                icon = <AlertCircle className="w-4 h-4 text-rose-600" />;
              }

              return (
                <li key={sub.id} className={`bg-white rounded-2xl border ${cardBorder} p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-lg text-slate-800">{sub.formTitle}</p>
                      <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-1.5 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formattedDate}
                      </p>
                    </div>

                    {/* Sync Status Badge */}
                    <div className="shrink-0 flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeBg}`}>
                        {icon}
                        {badgeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Failed sync error drawer */}
                  {isFailed && sub.errorMessage && (
                    <div className="mt-2 flex items-start gap-2.5 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">Sync Error Detail</p>
                        <p className="text-sm mt-0.5 leading-relaxed">{sub.errorMessage}</p>
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">Attempts made: {sub.retryCount}</p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
