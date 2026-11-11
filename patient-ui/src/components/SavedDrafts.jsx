import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllDrafts, deleteDraft } from '../utils/storage';
import { FileEdit, Trash2, Play, Calendar, AlertCircle, ArrowLeft } from 'lucide-react';
import { NavBar } from './NavBar';

export function SavedDrafts() {
  const [drafts, setDrafts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const navigate = useNavigate();

  const loadDrafts = async () => {
    setIsLoading(true);
    try {
      const allDrafts = await getAllDrafts();
      setDrafts(allDrafts);
    } catch (e) {
      console.error('Failed to load drafts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleDelete = async (id) => {
    await deleteDraft(id);
    setConfirmDeleteId(null);
    await loadDrafts();
  };

  return (
    <div className="min-h-screen radiant-canvas font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/forms"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Assigned Forms</span>
          </Link>
          <span className="font-mono text-xs text-slate-400">
            Local Storage Ledger
          </span>
        </div>

        {/* Section Header Card */}
        <div className="radiant-card rounded-2xl p-6 sm:p-7 mb-8 relative overflow-hidden">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-bold mb-3 border border-amber-200/70 font-mono">
              <FileEdit className="w-3.5 h-3.5 text-amber-600" />
              <span>OFFLINE_DRAFT_VAULT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Locally Cached Drafts
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              In-progress clinical questionnaires saved on this physical terminal. Draft responses remain
              encrypted within the browser’s sandboxed storage until final verification and submission.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 radiant-card rounded-2xl">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-teal-600 animate-spin" />
            <span className="font-mono text-xs text-slate-500">Querying IndexedDB draft store...</span>
          </div>
        ) : drafts.length === 0 ? (
          /* Empty State */
          <div className="radiant-card rounded-2xl p-12 sm:p-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FileEdit className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Active Drafts Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              All started questionnaires have either been completed or none have been cached on this terminal yet.
            </p>
            <Link
              to="/forms"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition shadow-xs active:translate-y-[1px]"
            >
              Browse Assigned Protocols
            </Link>
          </div>
        ) : (
          /* Drafts Ledger Grid */
          <div className="space-y-3">
            {drafts.map((draft) => {
              const answersCount = draft.answers
                ? Object.keys(draft.answers).filter(
                    (k) =>
                      draft.answers[k] !== undefined &&
                      draft.answers[k] !== null &&
                      draft.answers[k] !== ''
                  ).length
                : 0;
              const formattedDate = new Date(draft.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={draft.id}
                  className="radiant-card rounded-xl p-5 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 uppercase">
                        Draft Incomplete
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        ID: {draft.id.slice(0, 8)}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-950 leading-snug">
                      {draft.formTitle || 'Clinical Questionnaire'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formattedDate}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono font-medium text-slate-700">
                        {answersCount} fields answered
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {confirmDeleteId === draft.id ? (
                      /* Confirm Delete Dialog */
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                        <span className="text-rose-800 text-xs font-semibold px-2 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Discard draft permanently?
                        </span>
                        <button
                          onClick={() => handleDelete(draft.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-xs font-bold transition shadow-xs active:translate-y-[1px]"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded text-xs font-semibold transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Resume Button */}
                        <button
                          onClick={() => navigate(`/fill/${draft.formId}?draftId=${draft.id}`)}
                          className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-xs transition active:translate-y-[1px]"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Resume Intake</span>
                        </button>

                        {/* Discard Button */}
                        <button
                          onClick={() => setConfirmDeleteId(draft.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition"
                          title="Discard Draft"
                          aria-label="Discard Draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
