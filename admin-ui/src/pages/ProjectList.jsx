import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/common/Header';
import {
  FolderKanban,
  Building2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Search,
  Hash,
  X,
  Layers,
  CheckCircle2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const fetchProjects = () => {
    fetch(`${API_URL}/admin/projects`)
      .then((res) => res.json())
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleNameChange = (val) => {
    setName(val);
    setSlug(
      val
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 20)
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    try {
      const res = await fetch(`${API_URL}/admin/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description }),
      });
      if (res.ok) {
        const newProject = await res.json();
        setShowModal(false);
        setName('');
        setSlug('');
        setDescription('');
        navigate(`/projects/${newProject.id}`);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to create project record.');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Project create failed:', err);
      alert('Could not connect to the backend API. Verify service status.');
    }
  };

  const totalHospitals = projects.reduce(
    (sum, p) => sum + (p.hospitals?.length || 0),
    0
  );

  const filteredProjects = projects.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen radiant-canvas text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col relative overflow-hidden">
      {/* ─── Top Clinical Navigation Bar ─── */}
      <Header />

      {/* ─── Main Content Surface ─── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header Block & Action Bar */}
        <section className="pb-6 border-b border-slate-200/80 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200/70 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Multi-Center Protocol Orchestration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Clinical Studies &amp; Cohort Projects
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage study protocols, coordinate participating medical centers, and review data intake streams.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition active:translate-y-[1px] shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Study</span>
          </button>
        </section>

        {/* High-Density Color-Accented Telemetry Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {/* Card 1: Active Projects (Cobalt Blue Theme) */}
          <div className="radiant-card rounded-xl p-5 relative overflow-hidden group hover:border-blue-300 transition">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Active Studies
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-slate-950 font-mono">
              {projects.length}
            </div>
            <p className="text-xs text-blue-700/90 font-medium mt-1">Study protocols deployed</p>
          </div>

          {/* Card 2: Participating Sites (Indigo Theme) */}
          <div className="radiant-card rounded-xl p-5 relative overflow-hidden group hover:border-indigo-300 transition">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Participating Sites
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-slate-950 font-mono">
              {totalHospitals}
            </div>
            <p className="text-xs text-indigo-700/90 font-medium mt-1">Hospital centers synchronized</p>
          </div>

          {/* Card 3: Form Schemas (Royal Violet/Sky Theme) */}
          <div className="radiant-card rounded-xl p-5 relative overflow-hidden group hover:border-violet-300 transition">
            <div className="absolute top-0 left-0 right-0 h-1 bg-violet-600" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Clinical Form Schemas
              </span>
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-slate-950 font-mono">
              {projects.reduce((sum, p) => sum + (p.forms?.length || 0), 0)}
            </div>
            <p className="text-xs text-violet-700/90 font-medium mt-1">Dynamic versioned instruments</p>
          </div>
        </section>

        {/* Search & Filter Bar */}
        <div className="radiant-card rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search studies by title, protocol slug, or keyword..."
              aria-label="Search studies by title, protocol slug, or keyword"
              className="w-full pl-10 pr-3 py-2 text-xs text-slate-900 bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {filteredProjects.length} / {projects.length} STUDIES
            </span>
          </div>
        </div>

        {/* Studies Table / Ledger with Rich Colored Accents */}
        <div className="radiant-card rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-blue-800 text-xs font-mono">
              <span className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
              <span>LOADING CLINICAL STUDY REGISTRY...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.25]" />
              <h3 className="text-base font-semibold text-slate-800">
                {searchTerm ? 'No matching studies found' : 'No clinical studies recorded yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchTerm
                  ? 'Try adjusting your search criteria or clear the query.'
                  : 'Register your first multi-center project to begin configuring form protocols.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase font-mono tracking-wider text-[11px]">
                    <th className="py-3.5 px-5">Study Identifier &amp; Title</th>
                    <th className="py-3.5 px-4">Protocol Key</th>
                    <th className="py-3.5 px-4">Hospital Sites</th>
                    <th className="py-3.5 px-4">Study Status</th>
                    <th className="py-3.5 px-4">Registration Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-blue-50/30 transition group"
                    >
                      <td className="py-4 px-5">
                        <Link
                          to={`/projects/${project.id}`}
                          className="font-bold text-slate-950 text-sm hover:text-blue-600 transition block"
                        >
                          {project.name}
                        </Link>
                        {project.description && (
                          <p className="text-slate-500 text-xs font-normal truncate max-w-md mt-0.5">
                            {project.description}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                          <Hash className="w-3 h-3 text-blue-600" />
                          {project.slug}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{project.hospitals?.length || 0}</span>
                          <span className="text-slate-500 font-normal">sites</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active Protocol
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                        {project.created_at
                          ? new Date(project.created_at).toLocaleDateString()
                          : '—'}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/projects/${project.id}/hospitals`}
                            className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition"
                          >
                            Sites
                          </Link>
                          <Link
                            to={`/projects/${project.id}`}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition active:translate-y-[1px] shadow-2xs"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ─── Clinical Audit Footer ─── */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">HaloFormCraft</span>
            <span className="text-slate-300">·</span>
            <span>Multi-Center Clinical OS</span>
            <span className="text-slate-300">·</span>
            <span>v2.5.0-blue</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-blue-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Production Edge Enforced</span>
            </span>
          </div>
        </div>
      </footer>

      {/* ─── Modal: Register New Study Protocol ─── */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-study-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 sm:p-7 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="register-study-title" className="text-base font-bold text-slate-950">
                    Register New Clinical Study
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Define protocol scope and assign system identifier.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close registration dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Study Protocol Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Longevity Cohort Pilot 2026"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Study Slug Identifier *
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))
                    }
                    placeholder="e.g. LON_2026"
                    className="w-full border border-slate-300 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-slate-900 font-mono font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Unique system identifier for QR routing, URLs, and multi-site export tagging.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Protocol Scope &amp; Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Clinical objectives, target cohort size, or participating investigator notes..."
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition active:translate-y-[1px] shadow-sm shadow-blue-600/20"
                >
                  Confirm &amp; Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
