import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Shield, ChevronDown } from 'lucide-react';

export function Header({ subtitle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isConsole = location.pathname.startsWith('/console');
  const currentCrumb = subtitle || (isConsole ? 'ADMIN CONSOLE' : 'STUDY REGISTRY');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  return (
    <header className="radiant-header sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brandmark & Swiss Navigation Links */}
        <div className="flex items-center gap-6 sm:gap-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-sm tracking-wide shadow-sm shadow-blue-700/25 ring-1 ring-white/30 group-hover:scale-102 transition-transform">
              HF
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-950">
                Halo<span className="text-blue-600">Form</span><span className="text-slate-700">Craft</span>
              </span>
              <span className="text-slate-300 text-sm">/</span>
              <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/70 uppercase tracking-wide">
                {currentCrumb}
              </span>
            </div>
          </Link>

          {/* Swiss Minimalist Navigation Links (2px Active Baseline Rule) */}
          <nav className="flex items-center gap-6 sm:gap-8 h-16 text-xs font-semibold">
            <Link
              to="/"
              className={`h-full flex items-center gap-1.5 border-b-2 transition-all duration-150 ${
                !isConsole
                  ? 'border-blue-600 text-slate-950 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <span>Clinical Studies</span>
            </Link>

            <Link
              to="/console"
              className={`h-full flex items-center gap-2 border-b-2 transition-all duration-150 ${
                isConsole
                  ? 'border-blue-600 text-slate-950 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <span>Admin Console</span>
              <span
                className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border transition-colors ${
                  isConsole
                    ? 'bg-blue-100 text-blue-800 border-blue-200 font-bold'
                    : 'bg-blue-50 text-blue-700 border-blue-200/60 font-semibold'
                }`}
              >
                Platform
              </span>
            </Link>
          </nav>
        </div>

        {/* Right: Telemetry & Authenticated User Avatar Menu */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2 font-mono px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide">CLUSTER LIVE</span>
          </div>

          {/* User Profile Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-400 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                {userInitials}
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 text-xs animate-fadeIn space-y-3">
                <div className="pb-2 border-b border-slate-100">
                  <div className="font-bold text-slate-950 text-sm truncate">{user?.name || 'Administrator'}</div>
                  <div className="text-slate-500 font-mono text-[11px] truncate">{user?.email || 'admin@arcaai.com'}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/70">
                      {user?.role || 'Doctor'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">arca-halo</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    to="/console"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition"
                  >
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>Admin Console</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-medium transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
