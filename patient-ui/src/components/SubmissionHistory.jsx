import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllSubmissions, exportOfflineLedger } from '../utils/storage';
import { syncPendingSubmissions } from '../utils/syncQueue';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  ArrowLeft,
  AlertTriangle,
  History,
  ShieldCheck,
  Download,
  AlertOctagon
} from 'lucide-react';
import { NavBar } from './NavBar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const SubmissionHistory = () => {
  const [submissions, setSubmissions] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isOnline = useNetworkStatus();

  const loadSubmissions = async () => {
    try {
      // 1. Fetch synced submissions from backend
      let serverSubmissions = [];
      if (isOnline) {
        try {
          const res = await fetch(`${API_URL}/patient/submissions`);
          if (res.ok) {
            const serverData = await res.json();
            serverSubmissions = serverData.map((s) => ({
              id: `server-${s.id}`,
              client_submission_id: s.client_submission_id,
              formTitle: s.form_title || `Submission #${s.id}`,
              timestamp: s.submitted_at,
              syncStatus: 'SYNCED',
            }));
          }
        } catch (e) {
          console.warn('Could not fetch server submissions:', e);
        }
      }

      // 2. Get local submissions (PENDING, FAILED, DLQ_REVIEW, or unsynced)
      const localData = await getAllSubmissions();
      const localPending = localData.filter(
        (s) => s.syncStatus === 'PENDING' || s.syncStatus === 'FAILED' || s.syncStatus === 'DLQ_REVIEW' || s.syncStatus === 'SYNCING'
      );

      // 3. Merge: local pending first, then server-synced
      const merged = [...localPending, ...serverSubmissions];
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
    await syncPendingSubmissions(true); // Force immediate flush, bypassing backoff delays
    await loadSubmissions();
    setIsSyncing(false);
  };

  const handleExportLedger = async () => {
    try {
      setIsExporting(true);
      await exportOfflineLedger();
    } catch (e) {
      console.error('Failed to export offline ledger:', e);
      alert('Failed to export offline ledger: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const pendingCount = submissions.filter(
    (s) => s.syncStatus === 'PENDING' || s.syncStatus === 'FAILED' || s.syncStatus === 'SYNCING'
  ).length;

  const dlqCount = submissions.filter(
    (s) => s.syncStatus === 'DLQ_REVIEW'
  ).length;

  return (
    <div className="min-h-screen radiant-canvas font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/forms"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Assigned Forms</span>
          </Link>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Audited Clinical Registry</span>
          </div>
        </div>

        {/* Section Header Card with Telemetry Strip */}
        <div className="radiant-card rounded-2xl p-6 sm:p-7 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 text-xs font-bold mb-3 border border-teal-200/70 font-mono">
                <History className="w-3.5 h-3.5 text-teal-700" />
                <span>CASE_SUBMISSION_LEDGER</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                Transmission History
              </h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Log of completed questionnaire submissions. Submissions captured during network outages
                are safely held in the encrypted terminal buffer until re-establishing an authenticated edge link.
              </p>
            </div>

            {/* Actions: Sync & Offline Ledger Export */}
            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Emergency Export Button */}
              <button
                onClick={handleExportLedger}
                disabled={isExporting}
                title="Download all local records and drafts as an offline JSON ledger"
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition active:translate-y-[1px]"
              >
                <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : 'text-slate-600'}`} />
                <span>{isExporting ? 'Exporting...' : 'Export Offline Ledger'}</span>
              </button>

              {/* Sync Now Action Block */}
              {(pendingCount > 0 || dlqCount > 0) && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-900 text-white p-2.5 sm:px-3 sm:py-2 rounded-xl shadow-xs">
                  <div className="flex items-center gap-2 px-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="font-mono text-xs font-bold text-amber-300">
                      {pendingCount + dlqCount} PENDING
                    </span>
                  </div>
                  <button
                    onClick={handleSyncNow}
                    disabled={!isOnline || isSyncing}
                    className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs active:translate-y-[1px] ${
                      !isOnline
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-teal-600 hover:bg-teal-500 text-white'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Force Sync Now'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 radiant-card rounded-2xl">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-teal-600 animate-spin" />
            <span className="font-mono text-xs text-slate-500">Querying submission transmission registry...</span>
          </div>
        ) : submissions.length === 0 ? (
          /* Empty State */
          <div className="radiant-card rounded-2xl p-12 sm:p-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Submissions Recorded</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              You haven't completed any forms from this workstation yet. Once submitted, records will appear here with verification hashes.
            </p>
            <Link
              to="/forms"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition shadow-xs active:translate-y-[1px]"
            >
              Select Form to Fill
            </Link>
          </div>
        ) : (
          /* Submissions Ledger */
          <div className="space-y-3">
            {submissions.map((sub) => {
              const formattedDate = new Date(sub.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const isSynced = sub.syncStatus === 'SYNCED';
              const isSyncingItem = sub.syncStatus === 'SYNCING';
              const isPending = sub.syncStatus === 'PENDING';
              const isFailed = sub.syncStatus === 'FAILED';
              const isDlq = sub.syncStatus === 'DLQ_REVIEW';

              return (
                <div
                  key={sub.id}
                  className={`radiant-card rounded-xl border p-5 transition flex flex-col gap-3 ${
                    isDlq
                      ? 'border-purple-300 bg-purple-50/20'
                      : isPending || isSyncingItem
                      ? 'border-amber-300 bg-amber-50/20'
                      : isFailed
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-slate-400">
                          RECORD #{sub.id.replace('server-', '')}
                        </span>
                        {sub.client_submission_id && (
                          <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title={`Idempotency UUID: ${sub.client_submission_id}`}>
                            KEY:{sub.client_submission_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-slate-950">
                        {sub.formTitle}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{formattedDate}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 flex items-center">
                      {isSynced && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>SYNCED</span>
                        </span>
                      )}
                      {isSyncingItem && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-900 border border-blue-300 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                          <span>TRANSMITTING</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>QUEUED_OFFLINE</span>
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-900 border border-rose-300">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>RETRY_SCHEDULED</span>
                        </span>
                      )}
                      {isDlq && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-900 border border-purple-300">
                          <AlertOctagon className="w-3.5 h-3.5 text-purple-600" />
                          <span>REQUIRES_REVIEW</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Failed Sync Details */}
                  {isFailed && sub.errorMessage && (
                    <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Transmission Fault:</span>
                      </div>
                      <p className="font-mono text-[11px] leading-relaxed">{sub.errorMessage}</p>
                      <p className="font-mono text-[10px] text-rose-700 mt-1">
                        Attempt {sub.retryCount || 1} · Next attempt scheduled via exponential backoff
                      </p>
                    </div>
                  )}

                  {/* Dead-Letter Queue (DLQ) Details */}
                  {isDlq && (
                    <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-xs">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <AlertOctagon className="w-3.5 h-3.5 text-purple-600" />
                        <span>Schema Validation Conflict (DLQ):</span>
                      </div>
                      <p className="font-mono text-[11px] leading-relaxed">{sub.errorMessage || 'Payload rejected by server schema validation.'}</p>
                      <p className="font-mono text-[10px] text-purple-700 mt-1">
                        Isolated in Dead-Letter Queue to prevent blocking subsequent submissions. Included in Offline Ledger export.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
