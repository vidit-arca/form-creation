import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAllDrafts, getAllSubmissions } from '../utils/storage';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import { FolderHeart, History, Wifi, WifiOff } from 'lucide-react';
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
    // Read session context via validated helper
      const ctx = readContext();
      setContext(ctx);

    updateCounts();
    // Poll every 3 seconds to keep counts perfectly in sync across different pages
    const interval = setInterval(updateCounts, 3000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const hasContext = context.project || context.site;

  return (
    <nav className="bg-white/85 backdrop-blur-xl border-b border-emerald-100/60 sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link to={hasContext ? "/forms" : "/"} className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <div className="flex flex-col leading-none gap-0.5">
              <span className="text-[18px] font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent">Halo</span><span className="text-slate-800 ml-0.5">Health<span className="ml-[2px]">Forms</span></span>
              </span>
              <span className="text-[9.5px] font-medium text-slate-400 tracking-[0.06em] uppercase">Patient Portal</span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Connection Status Indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-rose-50 text-rose-700 border border-rose-200/50 animate-pulse'}`}>
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Drafts Link */}
          <Link
            to="/drafts"
            className={`relative flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-300 ${location.pathname === '/drafts'
                ? 'bg-amber-50 text-amber-800 border border-amber-200/60 shadow-sm'
                : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50/50 border border-transparent'
              }`}
          >
            <FolderHeart className="w-4 h-4" />
            <span className="hidden sm:inline">Saved Drafts</span>
            {draftCount > 0 && (
              <span className="absolute -top-1.5 -right-1 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {draftCount}
              </span>
            )}
          </Link>

          {/* Submissions History Link */}
          <Link
            to="/history"
            className={`relative flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-300 ${location.pathname === '/history'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-sm'
                : 'text-slate-600 hover:text-emerald-750 hover:bg-emerald-50/50 border border-transparent'
              }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
            {pendingSyncCount > 0 && (
              <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {pendingSyncCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
