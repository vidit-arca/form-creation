import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Layers,
  CheckCircle2,
  Activity,
  Edit3
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function Dashboard() {
  const [forms, setForms] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/admin/forms`)
      .then((res) => res.json())
      .then((data) => {
        setForms(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch(`${API_URL}/admin/forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: '' }),
    });
    const newForm = await res.json();
    navigate(`/builder/${newForm.id}`);
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

  const totalForms = forms.length;
  const activeForms = forms.filter((f) => f.is_active).length;
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-sm tracking-wide shadow-sm shadow-blue-500/20 ring-1 ring-white/30">
                HF
              </div>
              <span className="font-bold text-base tracking-tight text-slate-950">
                Halo<span className="text-blue-600">Form</span>Craft
              </span>
            </Link>
            <span className="text-slate-300 text-sm">/</span>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/70 uppercase">
              Global Forms Repository
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
            AD
          </div>
        </div>
      </header>

      {/* ─── Main Content Surface ─── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header Block */}
        <section className="pb-6 border-b border-slate-200/80 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Clinical Forms Repository
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage clinical questionnaire templates, configure version drafts, and review responses.
            </p>
          </div>
        </section>

        {/* ─── 3 Stats Cards ─── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="radiant-card rounded-xl p-5 relative overflow-hidden group hover:border-blue-300 transition">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Total Forms
              </span>
              <FileText className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-slate-950 font-mono">
              {totalForms}
            </div>
            <span className="text-xs text-blue-700 font-medium">Instruments in library</span>
          </div>

          <div className="radiant-card rounded-xl p-5 relative overflow-hidden group hover:border-emerald-300 transition">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Live Protocols
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-slate-950 font-mono">
              {publishedForms}
            </div>
            <span className="text-xs text-emerald-700 font-medium">Active for participant intake</span>
          </div>

          <div className="radiant-card rounded-xl p-5 relative overflow-hidden group hover:border-amber-300 transition">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Active State
              </span>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-slate-950 font-mono">
              {activeForms}
            </div>
            <span className="text-xs text-amber-700 font-medium">Enabled in database</span>
          </div>
        </section>

        {/* ─── Create Form Bar ─── */}
        <section className="radiant-card rounded-xl p-5 sm:p-6 mb-8">
          <div className="max-w-2xl">
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide font-mono">
              Create New Dynamic Form
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Initialize a clean form container with visual builder and logic branching.
            </p>

            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Enter form title…"
                className="flex-1 bg-slate-50/80 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 p-2.5 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition active:translate-y-[1px] shadow-sm shadow-blue-500/20 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Form</span>
              </button>
            </form>
          </div>
        </section>

        {/* ─── Forms List ─── */}
        <section>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <h2 className="text-base font-bold text-slate-950">Form Instruments ({totalForms})</h2>
            <span className="text-xs text-slate-400 font-mono">VERSIONED TEMPLATES</span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-blue-800 text-xs font-mono">
              <span className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
              <span>RETRIEVING FORM PROTOCOLS...</span>
            </div>
          ) : forms.length === 0 ? (
            <div className="radiant-card rounded-xl p-12 text-center">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3 stroke-[1.25]" />
              <h3 className="text-sm font-bold text-slate-800">No forms recorded yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Initialize your first dynamic clinical form using the creation bar above.
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
                            ID: #{form.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Link
                        to={`/responses/${form.id}`}
                        className="px-3.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                      >
                        Responses
                      </Link>
                      <Link
                        to={`/builder/${form.id}`}
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
            <span>Clinical Forms Engine</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            FastAPI · PostgreSQL · React 19
          </span>
        </div>
      </footer>
    </div>
  );
}
