import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAllDrafts, getAllSubmissions } from '../utils/storage';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import { FileEdit, History, Wifi, WifiOff, Activity, Building2 } from 'lucide-react';
import { readContext } from '../utils/context';

export function NavBar() {
  const location = useLocation();
  const isOnline = useNetworkStatus();
  const [draftCount, setDraftCount] = useState(0);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [context, setContext] = useState({});

  const updateCounts = async () => {
    try {
      const drafts = await getAllDrafts();
      setDraftCount(drafts.length);

      const submissions = await getAllSubmissions();
      const pending = submissions.filter(
        (s) => s.syncStatus === 'PENDING' || s.syncStatus === 'FAILED'
      );
      setPendingSyncCount(pending.length);
    } catch (e) {
      console.warn('Failed to update counts:', e);
    }
  };

  useEffect(() => {
    const ctx = readContext();
    setContext(ctx);

    updateCounts();
    const interval = setInterval(updateCounts, 3000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const hasContext = Boolean(context.project || context.site);

  return (
    <nav className="radiant-header sticky top-0 z-50 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brandmark + Station Context */}
        <div className="flex items-center gap-3">
          <Link
            to={hasContext ? "/forms" : "/"}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-xs group-hover:shadow transition">
              <span className="font-mono font-black text-sm tracking-tighter">HF</span>
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-black tracking-tight text-slate-950">Halo</span>
                <span className="text-[15px] font-medium text-slate-600">HealthForms</span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/80 font-semibold uppercase">
                  Patient
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                Clinical Form Client · v2.5.0
              </span>
            </div>
          </Link>

          {/* Active Site/Study Context Pill */}
          {hasContext && (
            <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-200 text-xs">
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/70">
                <Building2 className="w-3 h-3 text-teal-700" />
                {context.site ? `SITE-${context.site}` : context.project}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold transition-all ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                : 'bg-rose-50 text-rose-800 border border-rose-200 animate-pulse'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Forms Route Link (if context active) */}
          {hasContext && (
            <Link
              to="/forms"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                location.pathname === '/forms'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Forms</span>
            </Link>
          )}

          {/* Saved Drafts Link */}
          <Link
            to="/drafts"
            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              location.pathname === '/drafts'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Drafts</span>
            {draftCount > 0 && (
              <span
                className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  location.pathname === '/drafts'
                    ? 'bg-teal-400 text-slate-950'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {draftCount}
              </span>
            )}
          </Link>

          {/* Submissions History Link */}
          <Link
            to="/history"
            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              location.pathname === '/history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
            {pendingSyncCount > 0 && (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                {pendingSyncCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
