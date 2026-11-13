import React, { useState, useEffect } from 'react';
import { adminConsoleApi } from '../../services/adminConsoleApi';
import { AuditDiffModal } from '../../components/console/AuditDiffModal';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Download,
  ArrowRight,
  Eye,
  Calendar,
  AlertTriangle,
  User,
  Activity,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'FORM_CRAFT', label: 'Form Craft' },
  { id: 'USER_MANAGEMENT', label: 'User Onboarding' },
  { id: 'ACCESS_CONTROL', label: 'RBAC & Access' },
  { id: 'CLINICAL_INTAKE', label: 'Clinical Intake' },
  { id: 'AUTHENTICATION', label: 'Authentication' },
  { id: 'STUDY_GOVERNANCE', label: 'Study Governance' },
];

export function AuditTrailPage() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [selectedEventForDiff, setSelectedEventForDiff] = useState(null);

  const fetchAuditEvents = async () => {
    setLoading(true);
    try {
      const res = await adminConsoleApi.getAuditEvents({
        page,
        page_size: pageSize,
        category: category !== 'ALL' ? category : undefined,
        severity: severity !== 'ALL' ? severity : undefined,
        search: searchTerm.trim() || undefined,
      });

      const items = Array.isArray(res) ? res : res?.items || [];
      const totalCount = res?.total ?? items.length;

      setEvents(items);
      setTotal(totalCount);
    } catch (err) {
      console.error('Failed to load audit events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, [page, category, severity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditEvents();
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'FORM_CRAFT':
        return 'bg-purple-50 text-purple-800 border-purple-200/80';
      case 'USER_MANAGEMENT':
        return 'bg-blue-50 text-blue-800 border-blue-200/80';
      case 'ACCESS_CONTROL':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200/80';
      case 'CLINICAL_INTAKE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      case 'AUTHENTICATION':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200/80';
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* ─── Page Header with Compliance Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
              21 CFR PART 11 ENFORCED
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-[11px] text-slate-500">IMMUTABLE SECURITY AUDIT TRAIL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
            Platform-Wide Activity &amp; Audit Trail
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Cryptographically timestamped record of every administrative operation, form lifecycle event, permission modification, and clinician login.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={fetchAuditEvents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-50 text-xs font-semibold cursor-pointer shadow-2xs"
            title="Refresh Audit Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <a
            href={adminConsoleApi.exportAuditCsvUrl({ category, severity, search: searchTerm })}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* ─── Category Filter Navigation Rail ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategory(cat.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap cursor-pointer ${
              category === cat.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─── Search & Secondary Filter Toolbar ─── */}
      <div className="radiant-card p-3 rounded-xl bg-white/70 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by actor name, email, action, or entity ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </form>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-mono">
            <span>Severity:</span>
            <select
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="NOTICE">NOTICE</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <span className="font-mono text-slate-400 hidden sm:inline">|</span>

          <span className="font-mono text-slate-500 tabular-nums">
            Total Events: <strong className="text-slate-900">{total}</strong>
          </span>
        </div>
      </div>

      {/* ─── Audit Trail Data Table ─── */}
      <div className="radiant-card rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Category &amp; Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Origin</th>
                <th className="py-3 px-4 text-right">State Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-mono">
                    <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-2" />
                    <div>Querying immutable audit records...</div>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400 font-mono">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-600 text-sm">No Audit Events Found</div>
                    <div className="text-xs text-slate-400 mt-1">
                      No activities match the selected filter criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                      {new Date(evt.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>

                    {/* Category & Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getCategoryColor(
                            evt.category
                          )}`}
                        >
                          {evt.category}
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                          {evt.action}
                        </span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{evt.actor_name || evt.actor_email}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {evt.actor_role} {evt.actor_email && `· ${evt.actor_email}`}
                        </div>
                      </div>
                    </td>

                    {/* Target Entity */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {evt.entity_name || `${evt.entity_type} #${evt.entity_id}`}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Type: {evt.entity_type} {evt.entity_id && `· ID: ${evt.entity_id}`}
                        </div>
                      </div>
                    </td>

                    {/* Origin */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {evt.service_origin}
                      </span>
                      {evt.site_code && (
                        <span className="ml-1 text-[10px] text-teal-700">Site: {evt.site_code}</span>
                      )}
                    </td>

                    {/* Diff Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEventForDiff(evt)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-semibold text-xs cursor-pointer transition shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Diff</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Footer ─── */}
        {total > pageSize && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500 bg-slate-50/50">
            <span>
              Page {page} of {totalPages} (Showing {(page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, total)} of {total})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Visual Before/After Diff Modal ─── */}
      {selectedEventForDiff && (
        <AuditDiffModal
          event={selectedEventForDiff}
          onClose={() => setSelectedEventForDiff(null)}
        />
      )}
    </div>
  );
}

