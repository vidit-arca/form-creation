import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function HospitalManager() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [siteCode, setSiteCode] = useState('');
  const [address, setAddress] = useState('');

  const fetchData = () => {
    Promise.all([
      fetch(`${API_URL}/admin/projects/${projectId}`).then(r => r.json()),
      fetch(`${API_URL}/admin/projects/${projectId}/hospitals`).then(r => r.json()),
    ]).then(([proj, hosps]) => {
      setProject(proj);
      setHospitals(Array.isArray(hosps) ? hosps : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [projectId]);

  // Auto-generate site code from name
  const handleNameChange = (val) => {
    setName(val);
    const words = val.trim().split(/\s+/);
    let code = '';
    if (words.length >= 3) {
      code = words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
    } else if (words.length === 2) {
      code = (words[0].slice(0, 2) + words[1][0]).toUpperCase();
    } else if (words.length === 1) {
      code = words[0].slice(0, 3).toUpperCase();
    }
    setSiteCode(code);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !siteCode.trim()) return;
    const res = await fetch(`${API_URL}/admin/projects/${projectId}/hospitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, site_code: siteCode, address: address || null, contact_info: null })
    });
    if (res.ok) {
      setShowModal(false);
      setName(''); setSiteCode(''); setAddress('');
      fetchData();
    } else {
      const err = await res.json();
      alert(err.detail || 'Failed to add hospital');
    }
  };

  const handleRemove = async (hospitalId, hospitalName) => {
    if (!confirm(`Remove "${hospitalName}" from this project?`)) return;
    await fetch(`${API_URL}/admin/projects/${projectId}/hospitals/${hospitalId}`, { method: 'DELETE' });
    fetchData();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* ─── Top Navigation ─── */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-blue-500/10">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex flex-col leading-none gap-0.5">
                <span className="text-[18px] font-extrabold tracking-tight">
                  <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent">Halo</span><span className="text-slate-800 ml-0.5">Form<span className="ml-[2px]">Craft</span></span>
                </span>
                <span className="text-[9.5px] font-medium text-slate-400 tracking-[0.06em] uppercase">Admin Platform</span>
              </div>
            </Link>
            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <Link to={`/projects/${projectId}`} className="text-sm font-medium text-slate-500 hover:text-blue-600 transition">{project?.name}</Link>
            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-sm font-medium text-slate-700">Hospitals</span>
          </div>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">A</div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">

        {/* ─── Header ─── */}
        <div className="mb-10">
          <Link to={`/projects/${projectId}`} className="text-sm text-slate-500 hover:text-blue-600 transition mb-3 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Back to {project?.name}
          </Link>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Hospitals & Centers</h1>
          <p className="text-slate-500 mt-2 text-lg">Map hospitals and field locations to <strong className="text-slate-700">{project?.name}</strong></p>
        </div>

        {/* ─── Add Hospital CTA ─── */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-8 mb-10 shadow-xl shadow-emerald-600/10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-56 h-56 bg-white rounded-full"></div>
            <div className="absolute left-1/2 -bottom-16 w-72 h-72 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <h2 className="text-xl font-bold text-white">Add Hospital / Center</h2>
            </div>
            <p className="text-emerald-200 text-sm mb-6">Map a new hospital, camp, or field location to this project. Each site gets a unique code for metadata tagging.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-emerald-700 px-7 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-emerald-50 transition-all active:scale-95 text-[15px]"
            >
              + Add Hospital
            </button>
          </div>
        </div>

        {/* ─── Hospitals List ─── */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Mapped Hospitals</h2>
          <p className="text-slate-500 text-sm mt-1">{hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''} in this project</p>
        </div>

        {hospitals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No hospitals mapped</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Add your first hospital or center to start collecting site-specific data.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {hospitals.map(hospital => (
              <div key={hospital.id} className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-300">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Site Code Badge */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm flex-shrink-0">
                      <span className="text-white font-extrabold text-sm tracking-wider">{hospital.site_code}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-slate-900 truncate">{hospital.name}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono">
                          {hospital.site_code}
                        </span>
                        {hospital.address && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                            {hospital.address}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${hospital.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hospital.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {hospital.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(hospital.id, hospital.name)}
                    className="text-slate-400 hover:text-red-500 transition p-2 rounded-lg hover:bg-red-50"
                    title="Remove hospital"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Footer ─── */}
      <div className="border-t border-slate-200/60 bg-white/40 backdrop-blur-sm mt-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <span className="text-sm font-semibold"><span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Halo</span><span className="text-slate-600 ml-0.5">Form<span className="ml-[2px]">Craft</span></span></span>
            <span className="text-slate-300 text-xs">·</span>
            <span className="text-xs text-slate-400">Admin Panel</span>
          </div>
          <span className="text-xs text-slate-400">Built with React + FastAPI</span>
        </div>
      </div>

      {/* ─── Add Hospital Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 border border-slate-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Hospital / Center</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hospital Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Baptist Hospital Bangalore"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Site Code *</label>
                <input
                  type="text"
                  value={siteCode}
                  onChange={(e) => setSiteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="e.g. BPA"
                  maxLength={6}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition font-mono text-lg tracking-widest"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">3-6 character code used for data tagging (auto-generated from name)</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Bellary Road, Bangalore"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-semibold hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-sm hover:shadow-md transition active:scale-95">Add Hospital</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
