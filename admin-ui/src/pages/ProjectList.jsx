import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api';

export function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const fetchProjects = () => {
    fetch(`${API_URL}/admin/projects`)
      .then(res => res.json())
      .then(data => { setProjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  // Auto-generate slug from name
  const handleNameChange = (val) => {
    setName(val);
    setSlug(val.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 20));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    const res = await fetch(`${API_URL}/admin/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, description })
    });
    if (res.ok) {
      const newProject = await res.json();
      setShowModal(false);
      setName(''); setSlug(''); setDescription('');
      navigate(`/projects/${newProject.id}`);
    } else {
      const err = await res.json();
      alert(err.detail || 'Failed to create project');
    }
  };

  const handleDelete = async (projectId, projectName) => {
    if (!confirm(`Deactivate project "${projectName}"? Forms will not be deleted.`)) return;
    await fetch(`${API_URL}/admin/projects/${projectId}`, { method: 'DELETE' });
    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* ─── Top Navigation Bar ─── */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">HaloFormCraft</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              A
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">

        {/* ─── Hero Section ─── */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your multi-center data collection projects.</p>
        </div>

        {/* ─── Stats ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Active</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{projects.length}</p>
            <p className="text-sm text-slate-500 mt-1">Active Projects</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Sites</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{projects.reduce((sum, p) => sum + (p.hospitals?.length || 0), 0)}</p>
            <p className="text-sm text-slate-500 mt-1">Total Hospitals</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Overview</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{projects.reduce((sum, p) => sum + (p.hospitals?.length || 0), 0)}</p>
            <p className="text-sm text-slate-500 mt-1">Centers Mapped</p>
          </div>
        </div>

        {/* ─── Create New Project CTA ─── */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 mb-10 shadow-xl shadow-blue-600/10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-56 h-56 bg-white rounded-full"></div>
            <div className="absolute -right-5 top-20 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute left-1/2 -bottom-16 w-72 h-72 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <h2 className="text-xl font-bold text-white">Create New Project</h2>
            </div>
            <p className="text-blue-200 text-sm mb-6">Start a new multi-center study or data collection program. Map hospitals and create forms within a unified project scope.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-blue-700 px-7 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all active:scale-95 text-[15px]"
            >
              + New Project
            </button>
          </div>
        </div>

        {/* ─── Project Cards ─── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Your Projects</h2>
            <p className="text-slate-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} active</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-blue-600"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No projects yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Create your first project to start managing multi-center data collection.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map(project => (
              <div key={project.id} className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-300 overflow-hidden">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm bg-gradient-to-br from-indigo-500 to-blue-600">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-slate-900 truncate group-hover:text-blue-700 transition-colors">{project.name}</h3>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" /></svg>
                          {project.slug}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                          {project.hospitals?.length || 0} hospital{(project.hospitals?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        {project.description && (
                          <span className="text-xs text-slate-400 truncate max-w-[200px]">{project.description}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <Link
                      to={`/projects/${project.id}/hospitals`}
                      className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100 hover:border-slate-300 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                      Hospitals
                    </Link>
                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center gap-2 bg-blue-600 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:bg-blue-700 shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            ))}
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

      {/* ─── Create Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 border border-slate-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Project Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Longevity Pilot 2026"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Project Slug *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  placeholder="e.g. LON_2026"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition font-mono"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">Unique identifier used in URLs and metadata tagging</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the project..."
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-semibold hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-sm hover:shadow-md transition active:scale-95">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
