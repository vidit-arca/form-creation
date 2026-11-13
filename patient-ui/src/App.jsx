import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useForm, useWatch, Controller } from 'react-hook-form';
import SignatureCanvas from 'react-signature-canvas';
import { QRScannerComponent } from './components/QRScannerComponent';
import { DOBAgeComponent } from './components/DOBAgeComponent';
import { BMIComponent } from './components/BMIComponent';
import { GPSComponent } from './components/GPSComponent';
import { CalculatedScoreComponent } from './components/CalculatedScoreComponent';
import { validateCohortRules } from './components/validateCohortRules';
import { CohortInputComponent } from './components/CohortInputComponent';
import { HomePage } from './components/HomePage';
import Select from 'react-select';
import { addSubmissionToQueue, formCacheStore, saveDraft, getDraft, deleteDraft } from './utils/storage';
import { NavBar } from './components/NavBar';
import { ChevronLeft, ArrowLeft, FolderHeart, Activity, Building2, ShieldCheck, ArrowRight, QrCode } from 'lucide-react';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { SubmissionHistory as OfflineHistory } from './components/SubmissionHistory';
import { SavedDrafts } from './components/SavedDrafts';
import { IntakeForm } from './components/IntakeForm';
import { DietaryRecallField } from './components/DietaryRecallField';
import { SystemicValuesReview } from './components/SystemicValuesReview';

const reactSelectPatientStyles = {
  control: (base, state) => ({
    ...base,
    border: state.isFocused ? '1px solid #0d9488' : '1px solid #cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(13, 148, 136, 0.15)' : 'none',
    '&:hover': { border: state.isFocused ? '1px solid #0d9488' : '1px solid #94a3b8' },
    borderRadius: '0.5rem',
    padding: '2px',
    fontSize: '0.875rem',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#0f766e' : state.isFocused ? '#f0fdfa' : 'white',
    color: state.isSelected ? 'white' : '#0f172a',
    cursor: 'pointer',
    fontSize: '0.875rem',
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#ccfbf1',
    borderRadius: '0.375rem',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#115e59',
    fontWeight: 600,
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#115e59',
    ':hover': {
      backgroundColor: '#99f6e4',
      color: '#134e4a',
    },
  }),
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
import { readContext, writeContext, clearContext as clearStoredContext } from './utils/context';

// ── Context Helper: Read/Write site context from URL params + localStorage ──
function getSiteContext() {
  return readContext();
}

function ContextBanner({ context, onClear }) {
  if (!context || (!context.project && !context.site)) return null;
  return (
    <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-4 mb-6 shadow-xs flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-teal-300">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-300 font-bold">
              Active Study Context
            </span>
            {context.site && (
              <span className="bg-emerald-400 text-slate-950 px-2 py-0.5 rounded font-mono text-xs font-bold shadow-2xs">
                SITE {context.site}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 mt-0.5 font-mono">
            {context.project && `Project: ${context.project}`}
            {context.center && ` · Station: ${context.center}`}
          </p>
        </div>
      </div>
      <button
        onClick={onClear}
        className="text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition px-2.5 py-1.5 rounded-lg border border-white/10"
        title="Clear context"
      >
        Clear Station Context
      </button>
    </div>
  );
}

function Dashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState(null); // null = not yet checked
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Read URL params (from QR redirect)
    const params = new URLSearchParams(window.location.search);
    const urlContext = {
      project: params.get('project') || null,
      site: params.get('site') || null,
      center: params.get('center') || null
    };

    // 2. If URL has context, lock it to localStorage
    if (urlContext.project || urlContext.site) {
      writeContext(urlContext);   // validated write
      setContext(urlContext);
    } else {
      // 3. Otherwise, read from localStorage
      const stored = getSiteContext();
      if (stored.project || stored.site) {
        setContext(stored);
      } else {
        setContext({}); // No context anywhere
      }
    }
  }, []);

  useEffect(() => {
    if (context === null) return; // Still checking

    // Only fetch if we have context — require QR scan
    if (!context.project && !context.site) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (context.project) params.set('project', context.project);
    if (context.site) params.set('site', context.site);
    const url = `${API_URL}/patient/forms?${params.toString()}`;

    fetch(url)
      .then(res => res.json())
      .then(async (data) => {
        setForms(data);
        setLoading(false);

        // Pre-cache all forms in the background for offline capability
        for (const f of data) {
          try {
            const resForm = await fetch(`${API_URL}/patient/forms/${f.id}`);
            if (resForm.ok) {
              const fullForm = await resForm.json();
              // Tag cached form with project slug and site code for easy offline filtering
              fullForm.project_slug = context.project;
              fullForm.site_code = context.site;
              await formCacheStore.setItem(f.id.toString(), fullForm);
            }
          } catch (e) {
            console.warn('Pre-caching failed for form:', f.id, e);
          }
        }
      })
      .catch(async () => {
        // Offline / Fetch failed: load cached forms
        try {
          const cachedForms = [];
          await formCacheStore.iterate((value) => {
            // Filter forms offline by matching cached project slug with current scanned context
            if (value && (!context.project || value.project_slug === context.project)) {
              cachedForms.push({
                id: value.form_id || value.id,
                title: value.title,
                description: value.description,
                project_slug: value.project_slug
              });
            }
          });
          if (cachedForms.length > 0) {
            setForms(cachedForms);
          }
        } catch (e) {
          console.error('Failed to load cached forms:', e);
        }
        setLoading(false);
      });
  }, [context]);

  const clearContext = () => {
    clearStoredContext();
    setContext({});
    setForms([]);
  };

  // No context — show "scan QR first" message
  const hasContext = context && (context.project || context.site);

  return (
    <div className="min-h-screen radiant-canvas font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* ─── Navigation ─── */}
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ─── Context Banner (shows when locked to a project/site) ─── */}
        <ContextBanner context={context} onClear={clearContext} />

        {/* ─── Clinical Header ─── */}
        <div className="radiant-card rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 text-xs font-bold mb-3 border border-teal-200/70 font-mono">
              <Activity className="w-3.5 h-3.5 text-teal-700" />
              <span>PROTOCOL_CATALOG_ACTIVE</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                Assigned Clinical Questionnaires
              </h1>
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60 self-start sm:self-auto">
                {forms.length} {forms.length === 1 ? 'Protocol' : 'Protocols'} Available
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Select an authorized case record instrument to begin clinical observation intake. Forms completed in offline stations are stored locally and encrypted.
            </p>
          </div>
        </div>

        {/* ─── Forms Grid ─── */}
        {context === null ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 radiant-card rounded-2xl">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-teal-600 animate-spin" />
            <span className="font-mono text-xs text-slate-500">Querying study protocol index...</span>
          </div>
        ) : !hasContext ? (
          <div className="radiant-card rounded-2xl p-12 sm:p-16 text-center">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-amber-600">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Scan Station QR Code</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Please scan the optical QR badge at your assigned study station or clinical site to unlock your protocol forms.
            </p>
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition shadow-xs active:translate-y-[1px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Launch Station Scanner</span>
            </Link>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 radiant-card rounded-2xl">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-teal-600 animate-spin" />
            <span className="font-mono text-xs text-slate-500">Loading assigned questionnaires...</span>
          </div>
        ) : forms.length === 0 ? (
          <div className="radiant-card rounded-2xl p-12 sm:p-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Published Protocols Assigned</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              There are currently no active questionnaires attached to this study site. Please verify site assignment with the coordinating investigator.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {forms.map((form) => (
              <div
                key={form.id}
                className="radiant-card rounded-xl p-6 transition flex flex-col justify-between group hover:border-teal-300"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/60 uppercase">
                      Protocol #{form.id}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      STATUS: ACTIVE
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-950 group-hover:text-teal-700 transition-colors leading-snug">
                    {form.title}
                  </h3>
                  <p className="text-slate-600 text-xs mt-2 line-clamp-3 leading-relaxed">
                    {form.description || 'Clinical observation and participant telemetry instrument.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-400">
                    Ready for intake
                  </span>
                  <Link
                    to={`/fill/${form.id}`}
                    className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-xs transition active:translate-y-[1px]"
                  >
                    <span>Start Questionnaire</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─── Clinical Footer ─── */}
      <footer className="border-t border-slate-200/80 bg-white/60 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">HaloHealthForms</span>
            <span>·</span>
            <span>Clinical Workstation Terminal</span>
          </div>
          <div className="flex items-center gap-1.5 text-teal-800">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>End-to-End Encrypted Patient Vault</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function evaluateLogic(logic, formValues) {
  if (!logic) return { isVisible: true, isRequired: false };

  const action = logic.action || 'show';
  const joinType = logic.joinType || 'AND';
  let rules = logic.rules || [];

  // Support backward compatibility for old single-rule format
  if (logic.fieldId) {
    rules = [{
      fieldId: logic.fieldId,
      operator: logic.operator || '==',
      value: logic.value
    }];
  }

  // Filter out invalid rules (no fieldId set yet)
  const validRules = rules.filter(r => r && r.fieldId);

  if (validRules.length === 0) {
    return { isVisible: true, isRequired: false };
  }

  const ruleResults = validRules.map(rule => {
    const depVal = formValues?.[rule.fieldId];
    const targetVal = rule.value;
    const op = rule.operator || '==';

    // Normalize: arrays (multi_select) → string for comparison
    let val;
    if (Array.isArray(depVal)) {
      val = depVal; // keep as array for 'contains'
    } else if (typeof depVal === 'object' && depVal !== null) {
      if (depVal.age !== undefined) val = depVal.age;
      else if (depVal.bmi !== undefined) val = depVal.bmi;
      else if (depVal.score !== undefined) val = depVal.score;
      else val = String(depVal);
    } else {
      val = depVal === undefined || depVal === null ? '' : depVal;
    }

    let conditionMet = false;
    if (op === '==') {
      if (Array.isArray(val)) conditionMet = val.includes(String(targetVal));
      else conditionMet = (String(val) === String(targetVal));
    } else if (op === '!=') {
      if (Array.isArray(val)) conditionMet = !val.includes(String(targetVal));
      else conditionMet = (String(val) !== String(targetVal));
    } else if (op === '<') conditionMet = (Number(val) < Number(targetVal));
    else if (op === '>') conditionMet = (Number(val) > Number(targetVal));
    else if (op === 'contains') {
      if (Array.isArray(val)) conditionMet = val.some(v => String(v).toLowerCase().includes(String(targetVal).toLowerCase()));
      else conditionMet = (val && String(val).toLowerCase().includes(String(targetVal).toLowerCase()));
    }

    return conditionMet;
  });

  let overallConditionMet = false;
  if (joinType === 'OR') {
    overallConditionMet = ruleResults.some(r => r);
  } else {
    overallConditionMet = ruleResults.every(r => r);
  }

  let isVisible = true;
  let isRequired = false;

  if (overallConditionMet) {
    if (action === 'hide') isVisible = false;
    if (action === 'require') isRequired = true;
  } else {
    if (action === 'show') isVisible = false;
  }

  return { isVisible, isRequired };
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50/60 p-6 sm:p-12 flex items-center justify-center font-sans">
          <div className="bg-white border border-rose-200 text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xs max-w-lg w-full">
            <div className="flex items-center gap-2 text-rose-700 font-mono text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>SCHEMA_RENDER_EXCEPTION</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950 mb-2">Clinical Protocol Display Error</h2>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              An unexpected condition interrupted the layout rendering engine. The error telemetry has been logged:
            </p>
            <div className="bg-slate-950 text-rose-300 p-3 rounded-lg text-xs font-mono mb-6 overflow-x-auto">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-xs active:translate-y-[1px]"
            >
              Reinitialize Terminal Viewport
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function FormRenderer() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const draftIdParam = searchParams.get('draftId');
  const [activeDraftId, setActiveDraftId] = useState(draftIdParam || null);
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, control, trigger, setValue, getValues, watch, reset, formState: { errors } } = useForm();
  const formValues = useWatch({ control });

  // Filters options based on optionConditions config (e.g. GDM only for Female)
  const getVisibleOptions = (field) => {
    const options = field.options || [];
    const conditions = field.optionConditions || {};
    if (Object.keys(conditions).length === 0) return options;
    return options.filter(opt => {
      const cond = conditions[opt];
      if (!cond || !cond.fieldId) return true; // no condition = always visible
      const depVal = formValues?.[cond.fieldId] ?? '';
      const targetVal = String(cond.value ?? '');
      const actualVal = String(depVal);
      if (cond.operator === '!=') return actualVal !== targetVal;
      return actualVal === targetVal;
    });
  };

  const handleSaveDraft = async () => {
    try {
      const currentValues = getValues();
      const formTitle = formConfig?.title || 'Unknown Form';

      const savedId = await saveDraft(activeDraftId, id, formTitle, currentValues);
      setActiveDraftId(savedId);

      alert("Draft saved successfully!");
      navigate('/drafts');
    } catch (e) {
      console.error("Failed to save draft:", e);
      alert("Error saving draft. Please try again.");
    }
  };

  // ── Auto-save: silently persist form values every 30 seconds ──────────────
  // This protects against device power-off or browser crashes mid-fill.
  // It always overwrites the same draft ID so no duplicate drafts are created.
  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // null | 'saving' | 'saved'

  // 500ms debounced auto-save on active keystrokes / input modifications
  useEffect(() => {
    if (!formConfig || !formValues) return;
    const hasData = Object.values(formValues).some(
      (v) => v !== undefined && v !== null && v !== ''
    );
    if (!hasData) return;

    const timer = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        const formTitle = formConfig?.title || 'Unknown Form';
        const savedId = await saveDraft(activeDraftId, id, formTitle, formValues);
        setActiveDraftId(savedId);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 2500);
      } catch (err) {
        console.warn('[Auto-save] 500ms debounced auto-save failed:', err);
        setAutoSaveStatus(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formValues, formConfig, id, activeDraftId]);

  useEffect(() => {
    if (!formConfig) return; // Don't start until form schema is loaded

    const interval = setInterval(async () => {
      try {
        const currentValues = getValues();
        // Only auto-save if the user has actually entered something
        const hasData = Object.values(currentValues).some(
          (v) => v !== undefined && v !== null && v !== ''
        );
        if (!hasData) return;

        setAutoSaveStatus('saving');
        const formTitle = formConfig?.title || 'Unknown Form';
        const savedId = await saveDraft(activeDraftId, id, formTitle, currentValues);
        setActiveDraftId(savedId); // keep ID stable so we overwrite, not duplicate
        setAutoSaveStatus('saved');

        // Clear the "saved" indicator after 3 seconds
        setTimeout(() => setAutoSaveStatus(null), 3000);
      } catch (err) {
        console.error('[Auto-save] Failed to save draft:', err);
        setAutoSaveStatus(null);
      }
    }, 30_000); // every 30 seconds

    return () => clearInterval(interval); // clean up on unmount
  }, [formConfig, id, activeDraftId, getValues]);

  // Emergency auto-save listener on tab-close or navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const currentValues = getValues();
        const hasData = Object.values(currentValues).some(
          (v) => v !== undefined && v !== null && v !== ''
        );
        if (hasData) {
          const formTitle = formConfig?.title || 'Unknown Form';
          saveDraft(activeDraftId, id, formTitle, currentValues);
        }
      } catch (err) {
        console.warn('[Auto-save] Emergency beforeunload save failed:', err);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formConfig, id, activeDraftId, getValues]);


  useEffect(() => {
    const loadForm = async () => {
      try {
        // Try fetching online
        const res = await fetch(`${API_URL}/patient/forms/${id}`);
        if (!res.ok) throw new Error("Form not found");
        const data = await res.json();

        // Cache form schema for offline use
        await formCacheStore.setItem(id.toString(), data);
        setFormConfig(data);

        // Load draft answers if activeDraftId exists
        if (activeDraftId) {
          const draft = await getDraft(activeDraftId);
          if (draft && draft.answers) {
            reset(draft.answers);
          } else {
            reset({});
          }
        } else {
          reset({});
        }

        setLoading(false);
      } catch (err) {
        console.warn("Online form fetch failed, trying local cache...", err);
        try {
          const cachedData = await formCacheStore.getItem(id.toString());
          if (cachedData) {
            setFormConfig(cachedData);

            // Load draft answers if activeDraftId exists
            if (activeDraftId) {
              const draft = await getDraft(activeDraftId);
              if (draft && draft.answers) {
                reset(draft.answers);
              } else {
                reset({});
              }
            } else {
              reset({});
            }

            setLoading(false);
            return;
          }
        } catch (cacheErr) {
          console.error("Cache read failed:", cacheErr);
        }

        alert("Error loading form or form not published. Please check your internet connection.");
        navigate('/forms');
      }
    };

    loadForm();
  }, [id, activeDraftId, navigate]);

  // Split schema into pages and handle Exclusive Stop Criteria
  const { pages, isTerminated } = useMemo(() => {
    if (!formConfig || !formConfig.schema_data) return { pages: [], isTerminated: false };
    const p = [];
    let currentPage = { title: formConfig.title, description: formConfig.description, fields: [], logic: null };
    let terminated = false;

    for (const field of formConfig.schema_data) {
      if (terminated) break;

      if (field.type === 'page_break') {
        p.push(currentPage);
        currentPage = { title: field.label || 'New Section', description: field.description || '', fields: [], logic: field.logic };
      } else {
        currentPage.fields.push(field);

        // Evaluate Exclusive Stop Criteria
        if (field.enableExclusiveStop && field.exclusiveStopOptions?.length > 0) {
          const val = formValues?.[field.id];
          if (val !== undefined && val !== null && val !== '') {
            if (Array.isArray(val)) {
              if (val.some(v => field.exclusiveStopOptions.includes(v))) {
                terminated = true;
              }
            } else {
              if (field.exclusiveStopOptions.includes(val)) {
                terminated = true;
              }
            }
          }
        }
      }
    }
    p.push(currentPage);

    // Filter pages based on conditional logic
    const filteredPages = p.filter((page, index) => {
      if (index === 0) return true;
      const { isVisible } = evaluateLogic(page.logic, formValues);
      return isVisible;
    });

    return { pages: filteredPages, isTerminated: terminated };
  }, [formConfig, formValues]);

  // Clamp currentPageIndex if filtered pages change
  useEffect(() => {
    if (pages.length > 0 && currentPageIndex >= pages.length) {
      setCurrentPageIndex(Math.max(0, pages.length - 1));
    }
  }, [pages.length, currentPageIndex]);

  const slugify = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const onSubmit = async (data) => {
    // Check if there are more pages (and not terminated)
    if (currentPageIndex < pages.length - 1 && !isTerminated) {
      // Validate current page fields
      const currentFields = pages[currentPageIndex]?.fields || [];
      const currentPageFieldIds = currentFields.map(f => f.id);
      const isPageValid = await trigger(currentPageFieldIds);
      if (isPageValid) {
        setCurrentPageIndex(curr => curr + 1);
        window.scrollTo(0, 0);
      }
      return; // Do not submit yet
    }

    // If on the last page and NOT in review mode, switch to review mode
    if (!isReviewMode) {
      const currentFields = pages[currentPageIndex]?.fields || [];
      const currentPageFieldIds = currentFields.map(f => f.id);
      const isPageValid = await trigger(currentPageFieldIds);
      if (isPageValid) {
        setIsReviewMode(true);
        window.scrollTo(0, 0);
      }
      return;
    }

    // Prepare data for submission: Use variableName, or Slugify Label, fallback to ID
    const submissionPayload = {};

    // Identify all fields that are used as inputs for any calculated_score field
    const consumedFieldIds = new Set();
    formConfig.schema_data.forEach(field => {
      if (field.type === 'calculated_score' && field.calculatedFields) {
        field.calculatedFields.forEach(id => consumedFieldIds.add(id));
      }
    });

    formConfig.schema_data.forEach(field => {
      // Skip layout elements
      if (['page_break', 'section_header', 'instruction', 'divider'].includes(field.type)) return;

      // Skip fields that are already included in a calculated_score breakdown
      if (consumedFieldIds.has(field.id)) return;

      const key = field.variableName || slugify(field.label) || field.id;
      let val = data.hasOwnProperty(field.id) ? data[field.id] : null;

      const otherText = data[`${field.id}_otherText`];
      if (otherText) {
        if (Array.isArray(val)) {
          val = val.map(item => String(item).toLowerCase() === 'other' ? `Other: ${otherText}` : item);
        } else if (String(val).toLowerCase() === 'other') {
          val = `Other: ${otherText}`;
        }
      }

      // Normalize: treat false, empty string, and undefined as null for non-checkbox fields
      if (val === undefined || val === "") {
        submissionPayload[key] = null;
      } else if (val === false && field.type !== 'checkbox') {
        submissionPayload[key] = null;
      } else if (Array.isArray(val) && val.length === 0) {
        submissionPayload[key] = [];
      } else {
        submissionPayload[key] = val;
      }
    });

    // If last page or terminated, submit
    try {
      // Inject site context as query params for metadata tagging
      const ctx = getSiteContext();
      const metaParams = new URLSearchParams();
      if (ctx.project) metaParams.set('project', ctx.project);
      if (ctx.site) metaParams.set('site', ctx.site);
      if (ctx.center) metaParams.set('center', ctx.center);
      const metaQuery = metaParams.toString();
      const submitUrl = `${API_URL}/patient/forms/${id}/submissions${metaQuery ? '?' + metaQuery : ''}`;

      const clientSubmissionId = crypto.randomUUID();

      const finalPayload = {
        id: clientSubmissionId,
        formId: id,
        formTitle: formConfig?.title || 'Unknown Form',
        payload: submissionPayload,
        targetUrl: submitUrl // To be used by sync worker
      };

      if (!navigator.onLine) {
        // Offline Queuing with unique idempotency ID
        await addSubmissionToQueue(finalPayload);
        if (activeDraftId) await deleteDraft(activeDraftId);
        alert("⚠️ Offline Mode: Form completed successfully! Your answers are saved locally and will automatically sync when you reconnect.");
        navigate('/history');
      } else {
        // Online Submission with Idempotency Key header
        const res = await fetch(submitUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': clientSubmissionId
          },
          body: JSON.stringify({
            data: submissionPayload,
            client_submission_id: clientSubmissionId
          })
        });
        if (res.ok) {
          if (activeDraftId) await deleteDraft(activeDraftId);
          alert("Form submitted successfully!");
          navigate('/history');
        } else {
          // If the server is unreachable (5xx/4xx), queue locally with the SAME idempotency ID
          await addSubmissionToQueue(finalPayload);
          if (activeDraftId) await deleteDraft(activeDraftId);
          alert("Server issue detected. Saved locally to sync later.");
          navigate('/history');
        }
      }
    } catch (e) {
      console.error(e);
      // Fallback queuing if network error occurs mid-request
      const fallbackId = crypto.randomUUID();
      await addSubmissionToQueue({
        id: fallbackId,
        formId: id,
        formTitle: formConfig?.title || 'Unknown Form',
        payload: submissionPayload,
        targetUrl: submitUrl
      });
      if (activeDraftId) await deleteDraft(activeDraftId);
      alert("Network error. Saved locally to sync later.");
      navigate('/history');
    }
  };

  const handlePrevPage = () => {
    if (isReviewMode) {
      setIsReviewMode(false);
      window.scrollTo(0, 0);
      return;
    }
    setCurrentPageIndex(curr => Math.max(0, curr - 1));
    window.scrollTo(0, 0);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50/60 font-sans flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-teal-600 animate-spin" />
      <span className="font-mono text-xs text-slate-500">Loading clinical protocol instrument...</span>
    </div>
  );

  const currentFields = pages[currentPageIndex]?.fields || [];
  const totalPages = pages.length;

  return (
    <div className="min-h-screen radiant-canvas font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/forms"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Protocols</span>
          </Link>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span>PROTOCOL #{id}</span>
          </div>
        </div>

        <div className="radiant-card rounded-2xl overflow-hidden mb-8">
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-slate-100">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 uppercase">
                {formConfig.title}
              </span>
              {totalPages > 1 && (
                <span className="font-mono text-xs text-slate-500 font-semibold">
                  Step {currentPageIndex + 1} of {totalPages}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              {pages[currentPageIndex]?.title || formConfig.title}
            </h1>
            {(pages[currentPageIndex]?.description || (currentPageIndex === 0 && formConfig.description)) && (
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {pages[currentPageIndex]?.description || formConfig.description}
              </p>
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex gap-1.5">
                {pages.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i <= currentPageIndex ? 'bg-teal-600' : 'bg-slate-100'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 flex flex-wrap -mx-3">
          {isReviewMode ? (
            <div className="w-full px-3 mb-6">
              <SystemicValuesReview
                formConfig={formConfig}
                pages={pages}
                getValues={getValues}
                context={getSiteContext()}
                onJumpToPage={(targetIndex) => {
                  setIsReviewMode(false);
                  setCurrentPageIndex(targetIndex);
                  window.scrollTo(0, 0);
                }}
              />
            </div>
          ) : (
            currentFields.map(field => {
            let isRequired = field.required;
            let isVisible = true;

            // Evaluate conditional logic
            const logicResult = evaluateLogic(field.logic, formValues);
            if (!logicResult.isVisible) isVisible = false;
            if (logicResult.isRequired) isRequired = true;

            if (!isVisible) return null;

            let validationRules = { required: isRequired ? "This field is required" : false };
            if (field.validation) {
              if (field.validation.minLength) validationRules.minLength = { value: parseInt(field.validation.minLength), message: `Minimum ${field.validation.minLength} characters` };
              if (field.validation.maxLength) validationRules.maxLength = { value: parseInt(field.validation.maxLength), message: `Maximum ${field.validation.maxLength} characters` };
              if (field.validation.pattern) {
                try {
                  validationRules.pattern = { value: new RegExp(field.validation.pattern), message: "Invalid format" };
                } catch (e) {
                  console.warn("Invalid regex pattern:", field.validation.pattern);
                }
              }
              if (field.validation.min) validationRules.min = { value: Number(field.validation.min), message: `Minimum value is ${field.validation.min}` };
              if (field.validation.max) validationRules.max = { value: Number(field.validation.max), message: `Maximum value is ${field.validation.max}` };

              if (field.type === 'textarea' && field.validation.maxWords) {
                validationRules.validate = (value) => {
                  if (!value) return true;
                  const words = value.trim().split(/\s+/).filter(Boolean).length;
                  return words <= parseInt(field.validation.maxWords) || `Maximum ${field.validation.maxWords} words allowed`;
                };
              }
            }

            // Check if this field is the target of any cohort_input field
            const linkedCohortField = formConfig?.schema_data?.find(f =>
              f.type === 'cohort_input' &&
              (f.ageFieldId === field.id || f.genderFieldId === field.id)
            );

            if (linkedCohortField) {
              const baseValidate = validationRules.validate;
              validationRules.validate = (value) => {
                if (baseValidate) {
                  const baseRes = baseValidate(value);
                  if (baseRes !== true) return baseRes;
                }
                const cohortValue = getValues(linkedCohortField.id);
                return validateCohortRules(cohortValue, getValues(), linkedCohortField);
              };
            }

            if (field.type === 'cohort_input') {
              const baseValidate = validationRules.validate;
              validationRules.validate = (value) => {
                if (baseValidate) {
                  const baseRes = baseValidate(value);
                  if (baseRes !== true) return baseRes;
                }
                return validateCohortRules(value, getValues(), field);
              };
            }

            const isLayout = ['section_header', 'instruction', 'divider'].includes(field.type);
            const isDefaultFullWidth = ['section_header', 'instruction', 'divider', 'textarea', 'file', 'image', 'signature', 'cohort_input', 'dietary_recall_24h'].includes(field.type);

            let widthClass = 'w-full md:w-1/2';
            if (field.width === 'full' || (!field.width && isDefaultFullWidth)) {
              widthClass = 'w-full';
            } else if (field.width === 'half') {
              widthClass = 'w-full md:w-1/2';
            } else if (field.width === 'third') {
              widthClass = 'w-full md:w-1/3';
            }

            return (
              <div key={field.id} className={`px-3 mb-5 ${widthClass}`}>
                <div className={`flex flex-col h-full ${isLayout ? '' : 'bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors'}`}>
                {!isLayout && (
                  <>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center">
                      {field.label}
                      {isRequired && <span className="text-rose-500 ml-1 font-bold" title="Required">*</span>}
                    </label>
                    {field.helpText && <p className="text-xs text-slate-500 mb-2 leading-relaxed">{field.helpText}</p>}
                    {!field.helpText && <div className="mb-1"></div>}
                  </>
                )}

                {field.type === 'text' && (
                  <input
                    type="text"
                    className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                    placeholder={field.placeholder || "Text input"}
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    rows="4"
                    className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                    placeholder={field.placeholder || "Long text"}
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                    placeholder={field.placeholder || "0"}
                    onWheel={(e) => e.target.blur()}
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'email' && (
                  <input
                    type="email"
                    className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                    placeholder={field.placeholder || "email@example.com"}
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'phone' && (
                  <input
                    type="tel"
                    className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                    placeholder={field.placeholder || "+1 234 567 8900"}
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'date' && (() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const minAttr = field.validation?.minDate === 'today' ? todayStr : (field.validation?.minDate && field.validation?.minDate !== 'none' ? field.validation.minDate : undefined);
                  const maxAttr = field.validation?.maxDate === 'today' ? todayStr : (field.validation?.maxDate && field.validation?.maxDate !== 'none' ? field.validation.maxDate : undefined);
                  return (
                    <input
                      type="date"
                      className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white text-slate-900"
                      min={minAttr}
                      max={maxAttr}
                      {...register(field.id, {
                        ...validationRules,
                        ...(minAttr ? { min: { value: minAttr, message: `Date must be on or after ${minAttr === todayStr ? 'today' : minAttr}` } } : {}),
                        ...(maxAttr ? { max: { value: maxAttr, message: `Date must be on or before ${maxAttr === todayStr ? 'today' : maxAttr}` } } : {}),
                      })}
                    />
                  );
                })()}

                {field.type === 'time' && (
                  <input
                    type="time"
                    className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white text-slate-900"
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'year' && (() => {
                  const currentYear = new Date().getFullYear();
                  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);
                  return (
                    <select
                      className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white text-slate-900"
                      {...register(field.id, validationRules)}
                    >
                      <option value="">{field.placeholder || "Select Year..."}</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  );
                })()}

                {field.type === 'checkbox' && (
                  <div className="flex items-center mt-1 bg-white p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-600 transition"
                      {...register(field.id, validationRules)}
                    />
                    <span className="ml-3 text-slate-800 text-sm font-medium">Check to confirm</span>
                  </div>
                )}

                {field.type === 'dropdown' && (
                  <div className="space-y-2">
                    <select
                      className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white text-slate-900"
                      {...register(field.id, validationRules)}
                    >
                      <option value="">{field.placeholder || "Select..."}</option>
                      {getVisibleOptions(field).map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {String(formValues?.[field.id] || '').toLowerCase() === 'other' && (
                      <input
                        type="text"
                        placeholder="Please specify..."
                        className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-slate-50 mt-2 text-slate-900"
                        {...register(`${field.id}_otherText`, { required: "Please specify" })}
                      />
                    )}
                  </div>
                )}
                {field.type === 'searchable_dropdown' && (
                  <div className="space-y-2">
                    <Controller
                      name={field.id}
                      control={control}
                      rules={validationRules}
                      render={({ field: { onChange, value, ref } }) => (
                        <Select
                          inputRef={ref}
                          options={getVisibleOptions(field).map(opt => ({ label: opt, value: opt }))}
                          value={value ? { label: value, value: value } : null}
                          onChange={val => onChange(val ? val.value : '')}
                          isClearable
                          placeholder={field.placeholder || "Select..."}
                          styles={reactSelectPatientStyles}
                        />
                      )}
                    />
                    {String(formValues?.[field.id] || '').toLowerCase() === 'other' && (
                      <input
                        type="text"
                        placeholder="Please specify..."
                        className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-slate-50 mt-2 text-slate-900"
                        {...register(`${field.id}_otherText`, { required: "Please specify" })}
                      />
                    )}
                  </div>
                )}

                {field.type === 'radio' && (
                  <div className="space-y-2">
                    {getVisibleOptions(field).map((opt, i) => (
                      <label key={i} className="flex items-center bg-white p-3 border border-slate-200 rounded-lg cursor-pointer hover:border-teal-500/60 transition text-sm">
                        <input
                          type="radio"
                          value={opt}
                          className="w-4 h-4 text-teal-700 border-slate-300 focus:ring-teal-600 transition"
                          {...register(field.id, validationRules)}
                        />
                        <span className="ml-3 text-slate-800 font-medium">{opt}</span>
                      </label>
                    ))}
                    {String(formValues?.[field.id] || '').toLowerCase() === 'other' && (
                      <input
                        type="text"
                        placeholder="Please specify..."
                        className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-slate-50 mt-2 text-slate-900"
                        {...register(`${field.id}_otherText`, { required: "Please specify" })}
                      />
                    )}
                  </div>
                )}

                {field.type === 'gender' && (
                  <div className="space-y-2">
                    {(field.options || ['Male', 'Female', 'Other', 'Prefer not to say']).map((opt, i) => (
                      <label key={i} className="flex items-center bg-white p-3 border border-slate-200 rounded-lg cursor-pointer hover:border-teal-500/60 transition text-sm">
                        <input
                          type="radio"
                          value={opt}
                          className="w-4 h-4 text-teal-700 border-slate-300 focus:ring-teal-600 transition"
                          {...register(field.id, validationRules)}
                        />
                        <span className="ml-3 text-slate-800 font-medium">{opt}</span>
                      </label>
                    ))}
                    {String(formValues?.[field.id] || '').toLowerCase() === 'other' && (
                      <input
                        type="text"
                        placeholder="Please specify..."
                        className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-slate-50 mt-2 text-slate-900"
                        {...register(`${field.id}_otherText`, { required: "Please specify" })}
                      />
                    )}
                  </div>
                )}

                {field.type === 'multi_select' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange, value } }) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      return (
                        <div className="space-y-2">
                          {getVisibleOptions(field).map((opt, i) => {
                            const isNone = opt.toLowerCase() === 'none' || opt.toLowerCase() === 'none of the above' || opt.toLowerCase() === 'none of these';
                            return (
                              <label key={i} className="flex items-center bg-white p-3 border border-slate-200 rounded-lg cursor-pointer hover:border-teal-500/60 transition text-sm">
                                <input
                                  type="checkbox"
                                  value={opt}
                                  checked={currentValues.includes(opt)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (isNone) {
                                        onChange([opt]); // Selecting None clears everything else
                                      } else {
                                        // Selecting anything else clears None
                                        onChange([...currentValues.filter(v => {
                                          const l = v.toLowerCase();
                                          return l !== 'none' && l !== 'none of the above' && l !== 'none of these';
                                        }), opt]);
                                      }
                                    } else {
                                      onChange(currentValues.filter(v => v !== opt));
                                    }
                                  }}
                                  className="w-4 h-4 text-teal-700 border-slate-300 focus:ring-teal-600 transition"
                                />
                                <span className="ml-3 text-slate-800 font-medium">{opt}</span>
                              </label>
                            );
                          })}
                          {(Array.isArray(value) ? value : []).some(v => String(v).toLowerCase() === 'other') && (
                            <input
                              type="text"
                              placeholder="Please specify..."
                              className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-slate-50 mt-2 text-slate-900"
                              {...register(`${field.id}_otherText`, { required: "Please specify" })}
                            />
                          )}
                        </div>
                      );
                    }}
                  />
                )}

                {field.type === 'searchable_multi_select' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange, value, ref } }) => (
                      <div className="space-y-2">
                        <Select
                          inputRef={ref}
                          isMulti
                          options={getVisibleOptions(field).map(opt => ({ label: opt, value: opt }))}
                          value={(value || []).map(v => ({ label: v, value: v }))}
                          onChange={vals => {
                            if (!vals || vals.length === 0) {
                              onChange([]);
                              return;
                            }

                            // Check if 'None' was just selected
                            const lastAdded = vals[vals.length - 1].value;
                            const isLastAddedNone = lastAdded.toLowerCase() === 'none' || lastAdded.toLowerCase() === 'none of the above' || lastAdded.toLowerCase() === 'none of these';

                            if (isLastAddedNone) {
                              // If 'None' is selected, clear everything else
                              onChange([lastAdded]);
                            } else {
                              // If something else is selected, remove any existing 'None'
                              onChange(vals
                                .filter(v => {
                                  const l = v.value.toLowerCase();
                                  return l !== 'none' && l !== 'none of the above' && l !== 'none of these';
                                })
                                .map(v => v.value)
                              );
                            }
                          }}
                          isClearable
                          placeholder={field.placeholder || "Select options..."}
                          styles={reactSelectPatientStyles}
                        />
                        {(Array.isArray(value) ? value : []).some(v => String(v).toLowerCase() === 'other') && (
                          <input
                            type="text"
                            placeholder="Please specify..."
                            className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-slate-50 mt-2 text-slate-900"
                            {...register(`${field.id}_otherText`, { required: "Please specify" })}
                          />
                        )}
                      </div>
                    )}
                  />
                )}

                {field.type === 'file' && (
                  <input
                    type="file"
                    className="border border-slate-300 p-2 rounded-lg bg-white w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-800 hover:file:bg-teal-100 transition"
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'image' && (
                  <input
                    type="file"
                    accept="image/*"
                    className="border border-slate-300 p-2 rounded-lg bg-white w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-800 hover:file:bg-teal-100 transition"
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'rating' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange, value } }) => (
                      <div className="flex gap-2">
                        {[...Array(field.ratingMax || 5)].map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onChange(i + 1)}
                            className={`text-3xl focus:outline-none transition ${value > i ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    )}
                  />
                )}

                {field.type === 'scale' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange, value } }) => {
                      const min = field.scale?.min || 1;
                      const max = field.scale?.max || 10;
                      const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
                      return (
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-500 mb-2 font-mono font-bold uppercase tracking-wider">
                            <span>{field.scale?.minLabel || 'Poor'}</span>
                            <span>{field.scale?.maxLabel || 'Optimal'}</span>
                          </div>
                          <div className="flex justify-between items-center gap-1 bg-white p-2.5 border border-slate-200 rounded-lg shadow-2xs overflow-x-auto">
                            {options.map(opt => (
                              <label key={opt} className="flex flex-col items-center gap-1.5 cursor-pointer flex-1 group min-w-[28px]">
                                <input type="radio" name={field.id} value={opt} onChange={() => onChange(opt)} checked={value === opt} className="w-4 h-4 text-teal-700 focus:ring-teal-600" />
                                <span className={`text-xs font-mono font-bold transition ${value === opt ? 'text-teal-700' : 'text-slate-500 group-hover:text-slate-800'}`}>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    }}
                  />
                )}

                {field.type === 'signature' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange } }) => (
                      <div className="border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <SignatureCanvas
                          penColor="#090D16"
                          canvasProps={{ className: 'w-full h-36 bg-slate-50/50 cursor-crosshair' }}
                          onEnd={function () { onChange(this.toDataURL()); }}
                        />
                        <div className="bg-slate-100/70 px-3 py-1.5 text-[10px] text-slate-500 border-t border-slate-200 font-mono font-semibold uppercase tracking-wider text-right">
                          Record participant verification signature above
                        </div>
                      </div>
                    )}
                  />
                )}

                {field.type === 'qr_scanner' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange, value } }) => (
                      <QRScannerComponent field={field} value={value} onChange={onChange} setValue={setValue} />
                    )}
                  />
                )}

                {field.type === 'dob_age' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange, value } }) => (
                      <DOBAgeComponent field={field} value={value} onChange={onChange} />
                    )}
                  />
                )}

                {field.type === 'bmi' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange, value } }) => (
                      <BMIComponent field={field} value={value} onChange={onChange} />
                    )}
                  />
                )}

                {field.type === 'gps' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange, value } }) => (
                      <GPSComponent field={field} value={value} onChange={onChange} />
                    )}
                  />
                )}

                {field.type === 'calculated_score' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange } }) => (
                      <CalculatedScoreComponent field={field} control={control} schemaData={formConfig.schema_data} onChange={onChange} />
                    )}
                  />
                )}

                {field.type === 'cohort_input' && (
                  <CohortInputComponent
                    field={field}
                    control={control}
                    trigger={trigger}
                    register={register}
                    validationRules={validationRules}
                    errors={errors}
                  />
                )}

                {field.type === 'section_header' && <h2 className="text-base font-extrabold text-slate-950 border-b border-slate-200 pb-2">{field.label}</h2>}
                {field.type === 'instruction' && <p className="text-slate-700 bg-teal-50/60 p-4 rounded-xl border border-teal-200/70 text-xs sm:text-sm leading-relaxed">{field.description}</p>}
                {field.type === 'divider' && <hr className="border-slate-200 my-4" />}

                {field.type === 'dietary_recall_24h' && (
                  <DietaryRecallField
                    field={field}
                    value={watch(field.id)}
                    onChange={(val) => setValue(field.id, val, { shouldValidate: true })}
                  />
                )}

                {errors[field.id] && <span className="text-rose-600 text-xs mt-1.5 flex items-center gap-1 font-semibold"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {errors[field.id].message}</span>}
                </div>
              </div>
            );
          })
          )}

          {isTerminated && (
            <div className="w-full px-3 mt-4 bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold">
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>Questionnaire terminated according to protocol stop criteria.</span>
            </div>
          )}

          {/* Auto-save status indicator */}
          {autoSaveStatus && (
            <div className={`w-full px-3 mt-3 flex items-center gap-2 text-xs font-mono font-semibold transition-all duration-500 ${autoSaveStatus === 'saved' ? 'text-teal-700' : 'text-amber-600'}`}>
              {autoSaveStatus === 'saving' ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Auto-saving session cache…
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-teal-500" />
                  Encrypted draft cached locally ✓
                </>
              )}
            </div>
          )}

          <div className="w-full px-3 pt-6 border-t border-slate-100 mt-6 flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-2 flex-1">
              {currentPageIndex > 0 ? (
                <button
                  type="button"
                  onClick={handlePrevPage}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-[1px]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/forms')}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-[1px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Exit
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex-1 bg-amber-50 text-amber-800 border border-amber-300/80 px-4 py-2.5 rounded-lg font-bold text-xs hover:bg-amber-100 transition flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-[1px]"
              >
                <FolderHeart className="w-3.5 h-3.5 text-amber-700" /> Save Draft
              </button>
            </div>

            <button
              type="submit"
              className={`flex-1 text-white px-5 py-2.5 rounded-lg font-bold text-xs transition shadow-xs cursor-pointer active:translate-y-[1px] ${
                isReviewMode
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : isTerminated
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : 'bg-teal-700 hover:bg-teal-800'
              }`}
            >
              {isReviewMode
                ? 'Confirm & Transmit Submission'
                : isTerminated
                ? 'Review Form (Terminated)'
                : currentPageIndex < totalPages - 1
                ? 'Save & Continue'
                : 'Review Answers'}
            </button>
          </div>
        </form>
      </div>
      </main>
    </div>
  );
}

function History() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/patient/submissions`)
      .then(res => res.json())
      .then(data => {
        setSubmissions(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <Link to="/" className="text-gray-500 hover:text-gray-800 mb-6 inline-block">← Back to Forms</Link>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Submission History</h1>

      <div className="grid gap-4">
        {submissions.map(sub => (
          <div key={sub.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-800">Submission ID: {sub.id}</h3>
                <p className="text-gray-500 text-sm">Submitted at: {new Date(sub.submitted_at).toLocaleString()}</p>
              </div>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Completed</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{JSON.stringify(sub.data, null, 2)}</pre>
            </div>
          </div>
        ))}
        {submissions.length === 0 && (
          <p className="text-gray-500 bg-white p-8 text-center rounded-xl border border-gray-100">You haven't submitted any forms yet.</p>
        )}
      </div>
    </div>
  );
}


function App() {
  return (
    <Router>
      <NetworkStatusBanner />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/forms" element={<Dashboard />} />
        <Route path="/fill/:id" element={<ErrorBoundary><FormRenderer /></ErrorBoundary>} />
        <Route path="/drafts" element={<SavedDrafts />} />
        <Route path="/history" element={<OfflineHistory />} />
        <Route path="/admin/*" element={<Navigate replace to="/" />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
