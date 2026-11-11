import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  FileText,
  CheckCircle2,
  Building2,
  ArrowRight,
  Printer,
  Download,
  Copy,
  Plus,
  ArrowLeft,
  QrCode,
  Layers,
  Activity,
  Edit3
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function ProjectDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  // Patient portal base URL (adjust for production)
  const PATIENT_BASE = import.meta.env.VITE_PATIENT_URL || 'http://localhost:5174';

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/admin/projects/${projectId}`).then((r) => r.json()),
      fetch(`${API_URL}/admin/projects/${projectId}/forms`).then((r) => r.json()),
      fetch(`${API_URL}/admin/projects/${projectId}/stats`).then((r) => r.json()),
    ])
      .then(([proj, frms, sts]) => {
        setProject(proj);
        setForms(Array.isArray(frms) ? frms : []);
        setStats(sts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await fetch(`${API_URL}/admin/projects/${projectId}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: '' }),
      });
      const newForm = await res.json();
      navigate(`/projects/${projectId}/builder/${newForm.id}`);
    } catch (err) {
      alert('Failed to initialize form schema.');
    }
  };

  const getFormStats = (form) => {
    const draft = form.versions?.find((v) => v.status === 'DRAFT');
    const published = form.versions?.find((v) => v.status === 'PUBLISHED');
    const fieldCount = (draft?.schema_data || published?.schema_data || []).length;
    return {
      fieldCount,
      isPublished: !!published,
      versionCount: form.versions?.length || 0,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-xs text-blue-800">
        <span className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3 mr-3" />
        <span>LOADING STUDY DASHBOARD...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center shadow-xs">
          <h2 className="text-base font-bold text-slate-900">Study Project Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            The requested project ID #{projectId} does not exist or has been archived.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Studies Registry</span>
          </Link>
        </div>
      </div>
    );
  }

  const publishedForms = forms.filter((f) =>
    f.versions?.some((v) => v.status === 'PUBLISHED')
  ).length;

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
                Halo<span className="text-blue-600">Form</span><span className="text-slate-700">Craft</span>
              </span>
            </Link>

            <span className="text-slate-300 text-sm">/</span>
            <Link
              to="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition uppercase tracking-wide font-mono"
            >
              Studies
            </Link>
            <span className="text-slate-300 text-sm">/</span>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/70 truncate max-w-[180px]">
              {project.name}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              to={`/projects/${projectId}/hospitals`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Participating Sites ({stats?.hospital_count || 0})</span>
            </Link>

            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content Surface ─── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Project Header Block */}
        <section className="pb-6 border-b border-slate-200/80 mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-3 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ALL RESEARCH STUDIES</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                  {project.name}
                </h1>
                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                  #{project.slug}
                </span>
              </div>
              {project.description && (
                <p className="mt-1.5 text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Study Deployment
              </span>
            </div>
          </div>
        </section>

        {/* ─── 4 Category-Coded Stat Cards ─── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Forms */}
          <div className="radiant-card rounded-xl p-4 relative overflow-hidden group hover:border-blue-300 transition">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Total Forms
              </span>
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-950 font-mono">
              {stats?.form_count || 0}
            </div>
            <span className="text-[11px] text-blue-700 font-medium">Configured instruments</span>
          </div>

          {/* Published */}
          <div className="radiant-card rounded-xl p-4 relative overflow-hidden group hover:border-emerald-300 transition">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Live Protocols
              </span>
              <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-950 font-mono">
              {publishedForms}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">Ready for participant intake</span>
          </div>

          {/* Participating Hospitals */}
          <div className="radiant-card rounded-xl p-4 relative overflow-hidden group hover:border-indigo-300 transition">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Hospital Sites
              </span>
              <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-950 font-mono">
              {stats?.hospital_count || 0}
            </div>
            <span className="text-[11px] text-indigo-700 font-medium">Mapped clinical centers</span>
          </div>

          {/* Submissions */}
          <div className="radiant-card rounded-xl p-4 relative overflow-hidden group hover:border-violet-300 transition">
            <div className="absolute top-0 left-0 right-0 h-1 bg-violet-600" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Submissions
              </span>
              <div className="w-7 h-7 rounded-md bg-violet-50 text-violet-700 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-950 font-mono">
              {stats?.total_submissions || 0}
            </div>
            <span className="text-[11px] text-violet-700 font-medium">Total ingested records</span>
          </div>
        </section>

        {/* ─── Hospital Breakdown (if hospitals exist) ─── */}
        {stats?.hospitals?.length > 0 && (
          <section className="radiant-card rounded-xl p-5 mb-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide font-mono">
                  Site-by-Site Clinical Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submissions tracked per participating medical institution
                </p>
              </div>
              <Link
                to={`/projects/${projectId}/hospitals`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 hover:underline"
              >
                <span>Manage Site Codes</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.hospitals.map((h) => (
                <div
                  key={h.hospital_id}
                  className="flex items-center justify-between bg-slate-50/80 rounded-lg px-3.5 py-3 border border-slate-200/80 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 bg-blue-100 text-blue-800 rounded-md flex items-center justify-center text-xs font-bold font-mono shrink-0">
                      {h.site_code.slice(0, 3)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{h.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">SITE: {h.site_code}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 ml-2">
                    {h.submission_count} <span className="text-slate-400 font-normal">subs</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Permanent QR Codes (for hospitals) ─── */}
        {project && stats?.hospitals?.length > 0 && (
          <section className="radiant-card rounded-xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-950">
                    Station QR Codes for Participant Intake
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Permanent optical tokens for each site station. Download, print, or mount at clinics.
                </p>
              </div>

              <button
                onClick={() => {
                  const printArea = document.getElementById('qr-print-area');
                  if (!printArea) return;
                  const w = window.open('', '_blank');
                  if (!w) return;

                  const doc = w.document;
                  doc.title = `QR Codes — ${project.name}`;

                  const style = doc.createElement('style');
                  style.textContent = `body{font-family:Inter,system-ui,sans-serif;padding:40px;background:#fff;}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}.card{text-align:center;border:1px solid #cbd5e1;border-radius:12px;padding:20px;}.card h4{margin:10px 0 2px;font-size:13px;font-weight:700;}.card .code{font-family:monospace;color:#1d4ed8;background:#eff6ff;padding:2px 8px;border-radius:4px;font-size:11px;display:inline-block;border:1px solid #dbeafe;}.card .url{font-size:9px;color:#64748b;word-break:break-all;margin-top:6px;}@media print{body{padding:10px;}.grid{gap:16px;}}`;
                  doc.head.appendChild(style);

                  const h1 = doc.createElement('h1');
                  h1.style.marginBottom = '4px';
                  h1.style.fontSize = '18px';
                  h1.textContent = `HaloFormCraft — ${project.name}`;
                  doc.body.appendChild(h1);

                  const sub = doc.createElement('p');
                  sub.style.cssText = 'color:#64748b;font-size:12px;margin-bottom:20px';
                  sub.textContent = 'Permanent Clinical Station QR Codes — Offline-Ready';
                  doc.body.appendChild(sub);

                  doc.body.appendChild(printArea.cloneNode(true));
                  w.print();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition active:translate-y-[1px] shadow-sm shadow-blue-600/20 shrink-0 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print All Station QR Codes</span>
              </button>
            </div>

            <div id="qr-print-area">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {stats.hospitals.map((h) => {
                  const qrUrl = `${PATIENT_BASE}/?project=${project.slug}&site=${h.site_code}`;
                  const qrId = `qr-${h.site_code}`;
                  return (
                    <div
                      key={h.hospital_id}
                      className="card bg-slate-50/70 border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center hover:bg-white hover:border-slate-300 transition"
                    >
                      <div id={qrId} className="bg-white p-3.5 rounded-lg shadow-2xs mb-3 border border-slate-200">
                        <QRCodeSVG value={qrUrl} size={150} level="H" includeMargin={true} />
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
                        {h.name}
                      </h4>
                      <p className="code font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/70 mt-1">
                        SITE: {h.site_code}
                      </p>
                      <p className="url text-[10px] font-mono text-slate-400 mt-2 break-all leading-tight max-w-[200px]">
                        {qrUrl}
                      </p>

                      <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-slate-200/80 w-full justify-center">
                        <button
                          onClick={() => {
                            const svg = document.querySelector(`#${qrId} svg`);
                            if (!svg) return;
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const svgData = new XMLSerializer().serializeToString(svg);
                            const img = new Image();
                            img.onload = () => {
                              canvas.width = img.width * 2;
                              canvas.height = img.height * 2;
                              ctx.fillStyle = 'white';
                              ctx.fillRect(0, 0, canvas.width, canvas.height);
                              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                              const link = document.createElement('a');
                              link.download = `QR_${project.slug}_${h.site_code}.png`;
                              link.href = canvas.toDataURL('image/png');
                              link.click();
                            };
                            img.src =
                              'data:image/svg+xml;base64,' +
                              btoa(unescape(encodeURIComponent(svgData)));
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 transition"
                          title="Save as PNG"
                        >
                          <Download className="w-3 h-3 text-slate-500" />
                          <span>PNG</span>
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(qrUrl);
                            alert('Station URL copied to clipboard.');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 transition"
                          title="Copy Link"
                        >
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ─── Inline Form Creation Bar ─── */}
        <section className="radiant-card rounded-xl p-5 sm:p-6 mb-8">
          <div className="max-w-2xl">
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide font-mono">
              Create New Clinical Form Protocol
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Initialize a dynamic questionnaire scoped under{' '}
              <strong className="text-slate-700">{project.name}</strong>.
            </p>

            <form onSubmit={handleCreateForm} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Enter form protocol title (e.g. Baseline Vitals & Medical History)…"
                className="flex-1 bg-slate-50/80 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 p-2.5 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition active:translate-y-[1px] shadow-sm shadow-blue-600/20 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Form</span>
              </button>
            </form>
          </div>
        </section>

        {/* ─── Project Forms List ─── */}
        <section>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Study Form Protocols</h2>
              <p className="text-xs text-slate-500">
                {forms.length} instrument{forms.length !== 1 ? 's' : ''} versioned in this study
              </p>
            </div>
          </div>

          {forms.length === 0 ? (
            <div className="radiant-card rounded-xl p-12 text-center">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3 stroke-[1.25]" />
              <h3 className="text-sm font-bold text-slate-800">No forms recorded in this study</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Use the creation bar above to initialize your first clinical protocol form.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {forms.map((form) => {
                const { fieldCount, isPublished, versionCount } = getFormStats(form);
                return (
                  <div
                    key={form.id}
                    className="radiant-card rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-blue-300 transition"
                  >
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-2xs font-mono font-bold text-xs ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-950 truncate">{form.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPublished ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            {isPublished ? 'Published' : 'Draft'}
                          </span>

                          <span className="text-slate-400 font-mono text-[11px]">
                            {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            v{versionCount}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            ID: {form.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Link
                        to={`/projects/${projectId}/responses/${form.id}`}
                        className="px-3.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                      >
                        Responses
                      </Link>
                      <Link
                        to={`/projects/${projectId}/builder/${form.id}`}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition active:translate-y-[1px] shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Form</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200/90 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              Halo<span className="text-blue-600">Form</span>Craft
            </span>
            <span className="text-slate-300">/</span>
            <span>Multi-Center Protocol Coordinator</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Study Container #{projectId} · Production Live
          </span>
        </div>
      </footer>
    </div>
  );
}
