import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminConsoleApi } from '../../services/adminConsoleApi';
import {
  Server,
  Users,
  Shield,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Lock
} from 'lucide-react';

export function ConsoleDashboard() {
  const [healthData, setHealthData] = useState([]);
  const [userCount, setUserCount] = useState(null);
  const [roleCount, setRoleCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [health, usersRes, rolesRes] = await Promise.all([
        adminConsoleApi.getSystemHealth(),
        adminConsoleApi.getUsers({ page_size: 1 }).catch(() => ({ total: 0 })),
        adminConsoleApi.getRoles().catch(() => []),
      ]);

      setHealthData(health);
      setUserCount(usersRes?.total ?? (Array.isArray(usersRes?.items) ? usersRes.items.length : 0));
      setRoleCount(Array.isArray(rolesRes) ? rolesRes.length : (rolesRes?.items?.length ?? 5));
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load console dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000); // 15s heartbeat
    return () => clearInterval(interval);
  }, []);

  const onlineCount = healthData.filter((s) => s.status === 'Online' || s.status === 'Active').length;
  const isHealthy = onlineCount === healthData.length && healthData.length > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ─── Top Telemetry Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 radiant-card rounded-2xl">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
          />
          <div>
            <div className="text-xs font-bold text-slate-900 uppercase font-mono">
              System State: {isHealthy ? 'All Microservices Healthy' : `${onlineCount}/${healthData.length || 4} Services Operational`}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Keycloak Realm: <span className="font-semibold text-blue-700">arca-halo</span> &bull; Last check: {lastRefreshed.toLocaleTimeString()}
            </div>
          </div>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>Refresh Health</span>
        </button>
      </div>

      {/* ─── 4 Microservices Status Grid ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {healthData.map((svc) => {
          const isUp = svc.status === 'Online' || svc.status === 'Active';
          return (
            <div
              key={svc.id}
              className="radiant-card rounded-xl p-5 relative overflow-hidden group hover:border-blue-300 transition"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${isUp ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
              />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  {svc.name} (:{svc.port})
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                />
              </div>

              <div className="text-2xl font-extrabold tracking-tight text-slate-950 font-mono">
                {svc.status.toUpperCase()}
              </div>

              <div className="flex items-center justify-between mt-2 text-xs font-mono">
                <span className="text-slate-500">
                  {svc.latency ? `${svc.latency}ms latency` : 'Cluster DNS'}
                </span>
                <span className={isUp ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                  {isUp ? 'Operational' : 'Unavailable'}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ─── Platform Aggregate Metrics ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="radiant-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Onboarded Clinicians
            </span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-950 font-mono">
            {userCount ?? '—'}
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Doctors, PIs, &amp; Field Operators
          </p>
        </div>

        <div className="radiant-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Configured Roles
            </span>
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-950 font-mono">
            {roleCount ?? '5'}
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            SuperAdmin, Admin, Doctor, Operator
          </p>
        </div>

        <div className="radiant-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Auth Realm
            </span>
            <Lock className="w-5 h-5 text-violet-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700 font-mono">
            arca-halo
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Local Keycloak :8080 &bull; JWT RS256
          </p>
        </div>
      </section>

      {/* ─── Administrative Quick Navigation Cards ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link
          to="/console/users"
          className="radiant-card rounded-xl p-5 group hover:border-blue-400 transition flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-950">Clinician Onboarding</h3>
            <p className="text-xs text-slate-600 mt-1">
              Register medical personnel, manage supervisory trees, and assign site authorizations.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 mt-4 group-hover:translate-x-1 transition-transform">
            <span>Manage Clinicians</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/console/rbac"
          className="radiant-card rounded-xl p-5 group hover:border-indigo-400 transition flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 mb-3 group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-950">RBAC Security Matrix</h3>
            <p className="text-xs text-slate-600 mt-1">
              Configure granular module permissions and inspect role scopes across clinical tiers.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-indigo-700 mt-4 group-hover:translate-x-1 transition-transform">
            <span>Configure Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/console/logs"
          className="radiant-card rounded-xl p-5 group hover:border-slate-400 transition flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 mb-3 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-950">System Logs &amp; Audit</h3>
            <p className="text-xs text-slate-600 mt-1">
              Inspect real-time container log ingestion, service heartbeats, and audit trails.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 mt-4 group-hover:translate-x-1 transition-transform">
            <span>View Log Stream</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </section>
    </div>
  );
}

