import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllDrafts, deleteDraft } from '../utils/storage';
import { FolderHeart, Trash2, Play, Calendar, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 font-sans">
      <NavBar />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Back Link */}
        <Link to="/forms" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-700 font-semibold mb-6 transition-colors">
          ← Back to Catalog
        </Link>

        {/* Title Block */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-8 mb-8 shadow-xl shadow-amber-500/10 relative overflow-hidden text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-white rounded-full"></div>
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <FolderHeart className="w-8 h-8 text-amber-100" />
              <h1 className="text-3xl font-extrabold tracking-tight">Saved Drafts</h1>
            </div>
            <p className="text-amber-100 mt-2 text-md max-w-xl leading-relaxed">
              Resume editing any form you saved locally on this device. Drafts remain safely in browser storage even when completely offline.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-amber-200 border-t-amber-500"></div>
          </div>
        ) : drafts.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FolderHeart className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Saved Drafts</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">You don't have any incomplete forms saved on this device.</p>
            <Link to="/forms" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all active:scale-95">
              View Catalog
            </Link>
          </div>
        ) : (
          /* Drafts List */
          <div className="grid gap-5">
            {drafts.map((draft) => {
              const answersCount = draft.answers 
                ? Object.keys(draft.answers).filter(
                    (k) =>
                      draft.answers[k] !== undefined &&
                      draft.answers[k] !== null &&
                      draft.answers[k] !== ''
                  ).length 
                : 0;
              const formattedDate = new Date(draft.timestamp).toLocaleString();

              return (
                <div key={draft.id} className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors leading-snug">
                      {draft.formTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-slate-450 text-xs font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formattedDate}
                      </span>
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[11px] font-bold">
                        {answersCount} fields filled
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {confirmDeleteId === draft.id ? (
                      /* Confirm Delete Dialog */
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200/60 p-1.5 rounded-xl transition-all duration-300">
                        <span className="text-red-700 text-xs font-bold px-2 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Confirm Discard?
                        </span>
                        <button
                          onClick={() => handleDelete(draft.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition active:scale-95"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Resume Button */}
                        <button
                          onClick={() => navigate(`/fill/${draft.formId}?draftId=${draft.id}`)}
                          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.97] cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-white text-white" />
                          Resume Form
                        </button>

                        {/* Discard Button */}
                        <button
                          onClick={() => setConfirmDeleteId(draft.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-3 rounded-xl transition border border-transparent hover:border-red-200/50 cursor-pointer"
                          title="Discard Draft"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
