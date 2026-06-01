import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function Dashboard() {
  const [forms, setForms] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/admin/forms`)
      .then(res => res.json())
      .then(data => { setForms(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch(`${API_URL}/admin/forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: '' })
    });
    const newForm = await res.json();
    navigate(`/builder/${newForm.id}`);
  };

  const handleDelete = async (formId) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    await fetch(`${API_URL}/admin/forms/${formId}`, { method: 'DELETE' });
    setForms(forms.filter(f => f.id !== formId));
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

  const totalForms = forms.length;
  const activeForms = forms.filter(f => f.is_active).length;
  const publishedForms = forms.filter(f => f.versions?.some(v => v.status === 'PUBLISHED')).length;

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

        {/* ─── Hero / Welcome Section ─── */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your forms, track responses, and publish to patients.</p>
        </div>

        {/* ─── Stats Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Total</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{totalForms}</p>
            <p className="text-sm text-slate-500 mt-1">Total Forms</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Live</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{publishedForms}</p>
            <p className="text-sm text-slate-500 mt-1">Published</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Active</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{activeForms}</p>
            <p className="text-sm text-slate-500 mt-1">Active Forms</p>
          </div>
        </div>

        {/* ─── Create New Form Section ─── */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 mb-10 shadow-xl shadow-blue-600/10 relative overflow-hidden">
          {/* Decorative background pattern */}
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
              <h2 className="text-xl font-bold text-white">Create New Form</h2>
            </div>
            <p className="text-blue-200 text-sm mb-6">Start building a dynamic form with drag-and-drop fields, conditional logic, and multi-step sections.</p>
            <form onSubmit={handleCreate} className="flex gap-3">
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

        {/* ─── Existing Forms Section ─── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Your Forms</h2>
            <p className="text-slate-500 text-sm mt-1">{totalForms} form{totalForms !== 1 ? 's' : ''} in workspace</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-blue-600"></div>
          </div>
        ) : forms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No forms yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Create your first dynamic form using the builder above. Add fields, logic, and publish to your patients.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {forms.map(form => {
              const { fieldCount, isPublished, versionCount } = getFormStats(form);
              return (
                <div key={form.id} className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-300 overflow-hidden">
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-5 min-w-0">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${isPublished ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-slate-300 to-slate-400'}`}>
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>

                      {/* Details */}
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
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            v{versionCount}
                          </span>
                          <span className="text-xs text-slate-400">ID: {form.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <Link
                        to={`/responses/${form.id}`}
                        className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100 hover:border-slate-300 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Responses
                      </Link>
                      <Link
                        to={`/builder/${form.id}`}
                        className="inline-flex items-center gap-2 bg-blue-600 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:bg-blue-700 shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
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
