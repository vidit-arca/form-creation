import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Header } from '../../components/common/Header';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Server, Users, Settings, Activity, FileText } from 'lucide-react';

export function ConsoleLayout() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { to: '/console', label: 'Dashboard', icon: Activity, end: true },
    { to: '/console/users', label: 'User Onboarding', icon: Users },
    { to: '/console/rbac', label: 'RBAC & Access', icon: Server },
    { to: '/console/audit', label: 'Audit Trail', icon: FileText },
    { to: '/console/logs', label: 'System Logs', icon: Settings },
  ];

  return (
    <div className="min-h-screen radiant-canvas text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col relative overflow-hidden">
      {/* ─── Top Clinical Header ─── */}
      <Header subtitle="ADMIN CONSOLE" />

      {/* ─── Main Admin Console Content Surface ─── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">

        {/* Section Header & Sub-Navigation Rail */}
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200/70 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Arca Halo Infrastructure &amp; Security</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Platform Administration Control
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage system microservices, clinician onboarding, and granular RBAC permissions.
            </p>
          </div>

          {/* Swiss Minimalist Sub-Nav Rail */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs font-semibold shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${isActive
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-950 font-medium'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </section>

        {/* Nested Sub-Views */}
        <Outlet />

      </main>

      {/* ─── Swiss Clinical Precision Telemetry Strip ─── */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex flex-col md:flex-row items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-200/70 mt-auto gap-3">
        {/* Left: Platform & Regulatory Governance */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-600">
          <span className="font-bold tracking-tight text-slate-900">ARCA HALO</span>
          <span className="text-slate-300">/</span>
          <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>5-Tier RBAC Guard</span>
          </span>
          <span className="text-slate-300 hidden sm:inline">&bull;</span>
          <span className="text-slate-500 hidden sm:inline">21 CFR Part 11 Audit Active</span>
          {user?.role && (
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              Role: {user.role}
            </span>
          )}
        </div>

        {/* Right: Cluster Telemetry, Realm & Engineering Build */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-500">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50/80 border border-emerald-200/70 text-emerald-800 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tabular-nums">4/4 Services Operational</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-slate-400">
            <span>Realm:</span>
            <span className="text-slate-700 font-semibold">arca-halo</span>
          </div>

          <span className="text-slate-300 hidden md:inline">|</span>

          <span className="text-slate-500 tabular-nums">
            Build 2026.11 · <span className="text-slate-700 font-semibold">c792ef8</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

