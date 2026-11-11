import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Download,
  ArrowLeft,
  Building2,
  Table
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Converts any field value to a human-readable string.
 * Handles plain values, Date-like objects {day,month,year}, arrays, and generic objects.
 */
function formatCellValue(value) {
  if (value === null || value === undefined || value === '') return '—';

  // Plain primitive
  if (typeof value !== 'object') return String(value);

  // Array → join items
  if (Array.isArray(value)) {
    return value.map(formatCellValue).join(', ') || '—';
  }

  // Date-like object: { day, month, year } or { date } or ISO string keys
  if ('day' in value || 'month' in value || 'year' in value) {
    const { day, month, year } = value;
    const parts = [
      year,
      month !== undefined ? String(month).padStart(2, '0') : undefined,
      day !== undefined ? String(day).padStart(2, '0') : undefined,
    ].filter(Boolean);
    return parts.join('-');
  }

  // GPS / coordinate object
  if ('lat' in value || 'latitude' in value) {
    const lat = value.lat ?? value.latitude;
    const lng = value.lng ?? value.longitude ?? value.lon;
    return lng !== undefined ? `${lat}, ${lng}` : String(lat);
  }

  // Generic object → JSON
  return JSON.stringify(value);
}

export function Responses() {
  const { id, projectId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/admin/forms/${id}/submissions`)
      .then((res) => res.json())
      .then((data) => {
        setSubmissions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/forms/${id}/export`);
      if (!res.ok) {
        alert('Export generation failed. Please retry.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `protocol_${id}_responses.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not connect to backend server.');
    }
  };

  const backLink = projectId ? `/projects/${projectId}` : '/';
  const backLabel = projectId ? 'Return to Study Project' : 'Return to Studies Registry';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-xs text-blue-800">
        <span className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3 mr-3" />
        <span>COMPILING INGESTED RESPONSES...</span>
      </div>
    );
  }

  // Collect data field headers
  const headers = new Set();
  submissions.forEach((sub) => {
    if (sub.data && typeof sub.data === 'object') {
      Object.keys(sub.data).forEach((k) => headers.add(k));
    }
  });
  const headerList = Array.from(headers);

  // Check if any submissions have metadata
  const hasMetadata = submissions.some(
    (s) => s.hospital_id || s.center_id || s.submitted_by
  );

  return (
    <div className="min-h-screen radiant-canvas text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col relative overflow-hidden">
      {/* ─── Top Clinical Navigation Bar ─── */}
      <header className="radiant-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-sm tracking-wide shadow-sm shadow-blue-700/25 ring-1 ring-white/30">
                HF
              </div>
              <span className="font-bold text-base tracking-tight text-slate-950 hidden sm:inline">
                Halo<span className="text-blue-600">Form</span>Craft
              </span>
            </Link>

            <span className="text-slate-300 text-sm">/</span>
            <Link
              to={backLink}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition font-mono truncate max-w-[150px]"
            >
              Protocol #{id}
            </Link>
            <span className="text-slate-300 text-sm">/</span>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/70 uppercase">
              Responses Ledger
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
            AD
          </div>
        </div>
      </header>

      {/* ─── Main Content Surface ─── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header Block & Export CTA */}
        <section className="pb-6 border-b border-slate-200/80 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Link
              to={backLink}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-3 font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLabel.toUpperCase()}</span>
            </Link>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                Protocol #{id} Clinical Intake Stream
              </h1>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
                {submissions.length} Records Ingested
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Aggregated submission records captured across participating hospital field centers.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={submissions.length === 0}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition active:translate-y-[1px] shadow-sm shrink-0 ${
              submissions.length === 0
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 cursor-pointer'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Dataset</span>
          </button>
        </section>

        {/* Responses Ledger Table */}
        <section className="radiant-card rounded-xl overflow-hidden">
          {submissions.length === 0 ? (
            <div className="py-20 text-center">
              <Table className="w-10 h-10 text-slate-300 mx-auto mb-3 stroke-[1.25]" />
              <h3 className="text-sm font-bold text-slate-800">No submission records yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Participant records will populate here automatically as forms are submitted through the clinical intake portal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase font-mono tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-20">Record ID</th>
                    <th className="py-3 px-4 w-40">Submission Timestamp</th>
                    {hasMetadata && (
                      <>
                        <th className="py-3 px-4">Hospital Site</th>
                        <th className="py-3 px-4">Center / Station</th>
                        <th className="py-3 px-4">Investigator</th>
                      </>
                    )}
                    {headerList.map((header) => (
                      <th key={header} className="py-3 px-4 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-blue-50/30 transition font-mono text-[11px]"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        #{sub.id}
                      </td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </td>

                      {hasMetadata && (
                        <>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {sub.hospital_id ? (
                              <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                                <Building2 className="w-3 h-3 text-blue-600" />
                                {sub.hospital_id}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {sub.center_id || '—'}
                          </td>

                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {sub.submitted_by || '—'}
                          </td>
                        </>
                      )}

                      {headerList.map((header) => {
                        const cellVal = sub.data?.[header];
                        return (
                          <td
                            key={header}
                            className="py-3 px-4 text-slate-800 max-w-xs truncate font-sans text-xs"
                            title={formatCellValue(cellVal)}
                          >
                            {formatCellValue(cellVal)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200/90 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">HaloFormCraft</span>
            <span className="text-slate-300">/</span>
            <span>Intake Stream Inspector</span>
          </div>
          <span className="text-slate-400">Encrypted Field Data Warehouse</span>
        </div>
      </footer>
    </div>
  );
}
