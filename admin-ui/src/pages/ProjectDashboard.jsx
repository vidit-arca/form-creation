import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = 'http://localhost:8000/api';

export function ProjectDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  // Patient portal base URL (adjust for production)
  const PATIENT_BASE = 'http://localhost:5174';

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/admin/projects/${projectId}`).then(r => r.json()),
      fetch(`${API_URL}/admin/projects/${projectId}/forms`).then(r => r.json()),
      fetch(`${API_URL}/admin/projects/${projectId}/stats`).then(r => r.json()),
    ]).then(([proj, frms, sts]) => {
      setProject(proj);
      setForms(frms);
      setStats(sts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId]);

  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch(`${API_URL}/admin/projects/${projectId}/forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: '' })
    });
    const newForm = await res.json();
    navigate(`/projects/${projectId}/builder/${newForm.id}`);
  };

  const getFormStats = (form) => {
    const draft = form.versions?.find(v => v.status === 'DRAFT');
    const published = form.versions?.find(v => v.status === 'PUBLISHED');
    const fieldCount = (draft?.schema_data || published?.schema_data || []).length;
    return {
      fieldCount,
      isPublished: !!published,
      versionCount: form.versions?.length || 0
    };
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-blue-600"></div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-700">Project Not Found</h2>
        <Link to="/" className="text-blue-600 mt-4 inline-block hover:underline">← Back to Projects</Link>
      </div>
    </div>
  );

  const publishedForms = forms.filter(f => f.versions?.some(v => v.status === 'PUBLISHED')).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* ─── Top Navigation ─── */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">HaloFormCraft</span>
            </Link>
            {/* Breadcrumb */}
            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-sm font-medium text-slate-500">{project.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/projects/${projectId}/hospitals`} className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100 hover:border-slate-300 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
              Hospitals
            </Link>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">A</div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">

        {/* ─── Project Header ─── */}
        <div className="mb-10">
          <Link to="/" className="text-sm text-slate-500 hover:text-blue-600 transition mb-3 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            All Projects
          </Link>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-mono">
              {project.slug}
            </span>
            {project.description && <span className="text-slate-500 text-sm">{project.description}</span>}
          </div>
        </div>

        {/* ─── Stats ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{stats?.form_count || 0}</p>
            <p className="text-sm text-slate-500 mt-1">Forms</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{publishedForms}</p>
            <p className="text-sm text-slate-500 mt-1">Published</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{stats?.hospital_count || 0}</p>
            <p className="text-sm text-slate-500 mt-1">Hospitals</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{stats?.total_submissions || 0}</p>
            <p className="text-sm text-slate-500 mt-1">Submissions</p>
          </div>
        </div>

        {/* ─── Hospital Breakdown (if hospitals exist) ─── */}
        {stats?.hospitals?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-10">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Hospital Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.hospitals.map(h => (
                <div key={h.hospital_id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 text-xs font-bold">{h.site_code.slice(0, 3)}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{h.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{h.site_code}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-600">{h.submission_count} <span className="text-slate-400 font-normal">subs</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Permanent QR Codes (for hospitals) ─── */}
        {project && stats?.hospitals?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-10">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75H16.5v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75H16.5v-.75z" /></svg>
                  Patient Portal QR Codes
                </h3>
                <p className="text-sm text-slate-500 mt-1">These QR codes are <strong className="text-slate-700">permanent</strong> — download, print, and place at each site. They can be scanned unlimited times.</p>
              </div>
              <button
                onClick={() => {
                  const printArea = document.getElementById('qr-print-area');
                  if (!printArea) return;
                  const w = window.open('', '_blank');
                  w.document.write(`<html><head><title>QR Codes — ${project.name}</title><style>body{font-family:Inter,system-ui,sans-serif;padding:40px;}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;}.card{text-align:center;border:1px solid #e2e8f0;border-radius:16px;padding:24px;}.card h4{margin:12px 0 4px;font-size:14px;}.card .code{font-family:monospace;color:#4f46e5;background:#eef2ff;padding:2px 8px;border-radius:4px;font-size:12px;display:inline-block;}.card .url{font-size:9px;color:#94a3b8;word-break:break-all;margin-top:8px;}.badge{display:inline-block;background:#dcfce7;color:#166534;font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;margin-top:4px;}@media print{body{padding:20px;}.grid{gap:20px;}}</style></head><body><h1 style="margin-bottom:8px">${project.name}</h1><p style="color:#64748b;font-size:13px;margin-bottom:24px">Permanent QR Codes — No expiry, unlimited scans</p>${printArea.innerHTML}</body></html>`);
                  w.document.close();
                  w.print();
                }}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all active:scale-95 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 6.634A2.25 2.25 0 0116.5 5.25h-9a2.25 2.25 0 00-2.25 1.384" /></svg>
                Print All QR Codes
              </button>
            </div>

            {/* Permanent badge */}
            <div className="flex items-center gap-2 mb-5 mt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Permanent — No Expiry
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                Unlimited Scans
              </span>
            </div>

            <div id="qr-print-area">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.hospitals.map(h => {
                  const qrUrl = `${PATIENT_BASE}/?project=${project.slug}&site=${h.site_code}`;
                  const qrId = `qr-${h.site_code}`;
                  return (
                    <div key={h.hospital_id} className="card bg-slate-50 rounded-xl border border-slate-100 p-5 flex flex-col items-center text-center">
                      <div id={qrId} className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-slate-200">
                        <QRCodeSVG value={qrUrl} size={180} level="H" includeMargin={true} />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{h.name}</h4>
                      <p className="code text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1">{h.site_code}</p>
                      <p className="badge text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 font-semibold">Permanent Link</p>
                      <p className="url text-[10px] text-slate-400 mt-2 break-all leading-relaxed max-w-[220px]">{qrUrl}</p>

                      {/* Download & Copy buttons */}
                      <div className="flex items-center gap-2 mt-3">
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
                            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition"
                          title="Download as PNG"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                          PNG
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(qrUrl);
                            alert('URL copied to clipboard!');
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition"
                          title="Copy URL"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" /></svg>
                          Copy URL
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Create Form ─── */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 mb-10 shadow-xl shadow-blue-600/10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-56 h-56 bg-white rounded-full"></div>
            <div className="absolute left-1/2 -bottom-16 w-72 h-72 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              <h2 className="text-xl font-bold text-white">Create New Form</h2>
            </div>
            <p className="text-blue-200 text-sm mb-6">Form will be created under <strong className="text-white">{project.name}</strong> with project_id={project.id}.</p>
            <form onSubmit={handleCreateForm} className="flex gap-3">
              <input
                type="text"
                placeholder="Enter your form title…"
                className="flex-1 bg-white/15 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200/70 p-3.5 rounded-xl outline-none focus:bg-white/25 focus:border-white/40 transition text-[15px]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <button type="submit" className="bg-white text-blue-700 px-7 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all active:scale-95 text-[15px] whitespace-nowrap">
                + Create Form
              </button>
            </form>
          </div>
        </div>

        {/* ─── Forms List ─── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Project Forms</h2>
            <p className="text-slate-500 text-sm mt-1">{forms.length} form{forms.length !== 1 ? 's' : ''} in this project</p>
          </div>
        </div>

        {forms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No forms yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Create your first form for this project using the builder above.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {forms.map(form => {
              const { fieldCount, isPublished, versionCount } = getFormStats(form);
              return (
                <div key={form.id} className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-300 overflow-hidden">
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-5 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${isPublished ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-slate-300 to-slate-400'}`}>
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-slate-900 truncate group-hover:text-blue-700 transition-colors">{form.title}</h3>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            {isPublished ? 'Published' : 'Draft'}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs text-slate-400">v{versionCount}</span>
                          <span className="text-xs text-slate-400">ID: {form.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <Link
                        to={`/projects/${projectId}/responses/${form.id}`}
                        className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100 hover:border-slate-300 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Responses
                      </Link>
                      <Link
                        to={`/projects/${projectId}/builder/${form.id}`}
                        className="inline-flex items-center gap-2 bg-blue-600 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:bg-blue-700 shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Footer ─── */}
      <div className="border-t border-slate-200/60 bg-white/40 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-between text-sm text-slate-400">
          <span>HaloFormCraft Admin Panel</span>
          <span>Built with React + FastAPI</span>
        </div>
      </div>
    </div>
  );
}
