import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
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

const reactSelectPatientStyles = {
  control: (base, state) => ({
    ...base,
    border: state.isFocused ? '2px solid #22c55e' : '1px solid #d1d5db',
    boxShadow: 'none',
    '&:hover': { border: state.isFocused ? '2px solid #22c55e' : '1px solid #d1d5db' },
    borderRadius: '0.5rem',
    padding: '2px',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#16a34a' : state.isFocused ? '#f0fdf4' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    cursor: 'pointer',
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#dcfce7',
    borderRadius: '0.25rem',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#166534',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#166534',
    ':hover': {
      backgroundColor: '#bbf7d0',
      color: '#14532d',
    },
  }),
};

const API_URL = 'http://localhost:8000/api';

// ── Context Helper: Read/Write site context from URL params + localStorage ──
function getSiteContext() {
  try {
    return JSON.parse(localStorage.getItem('haloform_context')) || {};
  } catch { return {}; }
}

function ContextBanner({ context, onClear }) {
  if (!context || (!context.project && !context.site)) return null;
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-emerald-200/60 rounded-2xl p-4 mb-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {context.site && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-bold mr-2">{context.site}</span>}
            {context.project && <span className="text-slate-500 text-xs">Project: <strong className="text-slate-700">{context.project}</strong></span>}
          </p>
          {context.center && <p className="text-xs text-slate-400 mt-0.5">Center: {context.center}</p>}
        </div>
      </div>
      <button onClick={onClear} className="text-xs text-slate-400 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50" title="Clear context">
        ✕ Clear
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
      localStorage.setItem('haloform_context', JSON.stringify(urlContext));
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
      .then(data => {
        setForms(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [context]);

  const clearContext = () => {
    localStorage.removeItem('haloform_context');
    setContext({});
    setForms([]);
  };

  // No context — show "scan QR first" message
  const hasContext = context && (context.project || context.site);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">

      {/* ─── Navigation ─── */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-emerald-100/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent tracking-tight">HaloHealthForms</span>
            </Link>
          </div>
          <Link to="/history" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-200/60 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            My Submissions
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ─── Context Banner (shows when locked to a project/site) ─── */}
        <ContextBanner context={context} onClear={clearContext} />

        {/* ─── Hero Section ─── */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-10 mb-10 shadow-xl shadow-emerald-600/10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-white rounded-full"></div>
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-emerald-200 text-sm font-semibold uppercase tracking-wider">{forms.length} Form{forms.length !== 1 ? 's' : ''} Available</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">Welcome to Your<br />Health Portal</h1>
            <p className="text-emerald-100 mt-3 text-lg max-w-lg leading-relaxed">Complete the forms below to share your health information securely with your care provider.</p>
          </div>
        </div>

        {/* ─── Forms Grid ─── */}
        {context === null ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-emerald-200 border-t-emerald-600"></div>
          </div>
        ) : !hasContext ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Scan QR Code First</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">Please scan the QR code at your hospital or center to view the forms assigned to you.</p>
            <Link to="/" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all active:scale-95">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              Go to Scanner
            </Link>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-emerald-200 border-t-emerald-600"></div>
          </div>
        ) : forms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Forms Available</h3>
            <p className="text-slate-500 max-w-sm mx-auto">There are currently no published forms to fill out. Please check back later or contact your provider.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {forms.map((form, index) => {
              const colors = [
                { bg: 'from-emerald-400 to-teal-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60', hover: 'hover:border-emerald-300' },
                { bg: 'from-blue-400 to-indigo-500', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/60', hover: 'hover:border-blue-300' },
                { bg: 'from-violet-400 to-purple-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200/60', hover: 'hover:border-violet-300' },
                { bg: 'from-amber-400 to-orange-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', hover: 'hover:border-amber-300' },
              ];
              const c = colors[index % colors.length];

              return (
                <div key={form.id} className={`group bg-white rounded-2xl border ${c.border} shadow-sm hover:shadow-lg ${c.hover} transition-all duration-300 overflow-hidden flex flex-col`}>
                  {/* Color accent bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${c.bg}`}></div>

                  <div className="p-7 flex flex-col flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">{form.title}</h3>
                        <p className="text-slate-500 text-sm mt-1 line-clamp-2 leading-relaxed">{form.description || 'Complete this form to share your information with your care provider.'}</p>
                      </div>
                    </div>

                    <div className="mt-auto pt-4">
                      <Link
                        to={`/fill/${form.id}`}
                        className={`w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r ${c.bg} text-white px-6 py-3 rounded-xl font-bold text-[15px] shadow-md hover:shadow-lg transition-all active:scale-[0.98] hover:brightness-110`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Start Filling
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
      <div className="border-t border-emerald-100/60 bg-white/40 backdrop-blur-sm mt-16">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-slate-400">
          <span>HaloHealthForms Patient Portal</span>
          <span>Your data is secure & confidential</span>
        </div>
      </div>
    </div>
  );
}

function FormRenderer() {
  const { id } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const navigate = useNavigate();

  const { register, handleSubmit, control, trigger, setValue, getValues, reset, formState: { errors } } = useForm();
  const formValues = useWatch({ control });

  useEffect(() => {
    fetch(`${API_URL}/patient/forms/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Form not found");
        return res.json();
      })
      .then(data => {
        setFormConfig(data);
        reset({}); // IMPORTANT: Wipe any old data from previous sessions
        setLoading(false);
      })
      .catch(err => {
        alert("Error loading form or form not published.");
        navigate('/');
      });
  }, [id, navigate]);

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
          const val = formValues[field.id];
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
      if (page.logic && page.logic.fieldId) {
        const depVal = formValues[page.logic.fieldId];
        const targetVal = page.logic.value;
        const op = page.logic.operator || '==';
        const action = page.logic.action || 'show';

        let conditionMet = false;
        const val = depVal === undefined || depVal === null ? '' : depVal;

        if (op === '==') conditionMet = (String(val) === String(targetVal));
        if (op === '!=') conditionMet = (String(val) !== String(targetVal));
        if (op === '<') conditionMet = (Number(val) < Number(targetVal));
        if (op === '>') conditionMet = (Number(val) > Number(targetVal));
        if (op === 'contains') conditionMet = (val && String(val).toLowerCase().includes(String(targetVal).toLowerCase()));

        if (conditionMet && action === 'hide') return false;
        if (!conditionMet && action === 'show') return false;
      }
      return true;
    });

    return { pages: filteredPages, isTerminated: terminated };
  }, [formConfig, formValues]);

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
      const val = data.hasOwnProperty(field.id) ? data[field.id] : null;

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

      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: submissionPayload })
      });
      if (res.ok) {
        alert("Form submitted successfully!");
        navigate('/history');
      } else {
        alert("Failed to submit form");
      }
    } catch (e) {
      alert("Submission error");
    }
  };

  const handlePrevPage = () => {
    setCurrentPageIndex(curr => Math.max(0, curr - 1));
    window.scrollTo(0, 0);
  };

  if (loading) return <div className="p-8 flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  const currentFields = pages[currentPageIndex]?.fields || [];
  const totalPages = pages.length;

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans">
      <Link to="/" className="text-gray-500 hover:text-gray-800 mb-6 inline-block">← Back to Forms</Link>

      <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
        <div className="bg-green-600 p-6 text-white">
          <h1 className="text-2xl font-bold">{pages[currentPageIndex]?.title || formConfig.title}</h1>
          {(pages[currentPageIndex]?.description || (currentPageIndex === 0 && formConfig.description)) && <p className="mt-2 opacity-90">{pages[currentPageIndex]?.description || formConfig.description}</p>}

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-green-100">
                <span>Step {currentPageIndex + 1} of {totalPages}</span>
              </div>
              <div className="flex gap-2">
                {pages.map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i <= currentPageIndex ? 'bg-white' : 'bg-green-800 bg-opacity-40'}`}></div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {currentFields.map(field => {
            let isRequired = field.required;
            let isVisible = true;

            // Evaluate conditional logic
            if (field.logic && field.logic.fieldId) {
              const depVal = formValues[field.logic.fieldId];
              const targetVal = field.logic.value;
              const op = field.logic.operator || '==';
              const action = field.logic.action || 'show';

              let conditionMet = false;
              const val = depVal === undefined || depVal === null ? '' : depVal;

              if (op === '==') conditionMet = (String(val) === String(targetVal));
              if (op === '!=') conditionMet = (String(val) !== String(targetVal));
              if (op === '<') conditionMet = (Number(val) < Number(targetVal));
              if (op === '>') conditionMet = (Number(val) > Number(targetVal));
              if (op === 'contains') conditionMet = (val && String(val).toLowerCase().includes(String(targetVal).toLowerCase()));

              if (conditionMet) {
                if (action === 'hide') isVisible = false;
                if (action === 'require') isRequired = true;
              } else {
                if (action === 'show') isVisible = false;
              }
            }

            if (!isVisible) return null;

            let validationRules = { required: isRequired ? "This field is required" : false };
            if (field.validation) {
              if (field.validation.minLength) validationRules.minLength = { value: parseInt(field.validation.minLength), message: `Minimum ${field.validation.minLength} characters` };
              if (field.validation.maxLength) validationRules.maxLength = { value: parseInt(field.validation.maxLength), message: `Maximum ${field.validation.maxLength} characters` };
              if (field.validation.pattern) validationRules.pattern = { value: new RegExp(field.validation.pattern), message: "Invalid format" };
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

            const isLayout = ['section_header', 'instruction', 'divider'].includes(field.type);

            return (
              <div key={field.id} className={`flex flex-col ${isLayout ? '' : 'bg-gray-50 p-5 rounded-xl border border-gray-100'}`}>
                {!isLayout && (
                  <>
                    <label className="font-semibold text-gray-800 mb-1 flex items-center text-lg">
                      {field.label}
                      {isRequired && <span className="text-red-500 ml-1" title="Required">*</span>}
                    </label>
                    {field.helpText && <p className="text-sm text-gray-500 mb-3">{field.helpText}</p>}
                    {!field.helpText && <div className="mb-2"></div>}
                  </>
                )}

                {field.type === 'text' && (
                  <input
                    type="text"
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
                    placeholder={field.placeholder || "Text input"}
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    rows="4"
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
                    placeholder={field.placeholder || "Long text"}
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
                    placeholder={field.placeholder || "0"}
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'email' && (
                  <input
                    type="email"
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
                    placeholder={field.placeholder || "email@example.com"}
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'phone' && (
                  <input
                    type="tel"
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
                    placeholder={field.placeholder || "+1 234 567 8900"}
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'date' && (
                  <input
                    type="date"
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'time' && (
                  <input
                    type="time"
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'checkbox' && (
                  <div className="flex items-center mt-1 bg-white p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 transition"
                      {...register(field.id, validationRules)}
                    />
                    <span className="ml-3 text-gray-700">Check to confirm</span>
                  </div>
                )}

                {field.type === 'dropdown' && (
                  <select
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
                    {...register(field.id, validationRules)}
                  >
                    <option value="">{field.placeholder || "Select..."}</option>
                    {(field.options || []).map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {field.type === 'searchable_dropdown' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange, value, ref } }) => (
                      <Select
                        inputRef={ref}
                        options={(field.options || []).map(opt => ({ label: opt, value: opt }))}
                        value={value ? { label: value, value: value } : null}
                        onChange={val => onChange(val ? val.value : '')}
                        isClearable
                        placeholder={field.placeholder || "Select..."}
                        styles={reactSelectPatientStyles}
                      />
                    )}
                  />
                )}

                {field.type === 'radio' && (
                  <div className="space-y-3">
                    {(field.options || []).map((opt, i) => (
                      <label key={i} className="flex items-center bg-white p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-green-300 transition">
                        <input
                          type="radio"
                          value={opt}
                          className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 transition"
                          {...register(field.id, validationRules)}
                        />
                        <span className="ml-3 text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'gender' && (
                  <div className="space-y-3">
                    {(field.options || ['Male', 'Female', 'Other', 'Prefer not to say']).map((opt, i) => (
                      <label key={i} className="flex items-center bg-white p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-green-300 transition">
                        <input
                          type="radio"
                          value={opt}
                          className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 transition"
                          {...register(field.id, validationRules)}
                        />
                        <span className="ml-3 text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'multi_select' && (
                  <div className="space-y-3">
                    {(field.options || []).map((opt, i) => (
                      <label key={i} className="flex items-center bg-white p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-green-300 transition">
                        <input
                          type="checkbox"
                          value={opt}
                          className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 transition"
                          {...register(field.id, validationRules)}
                        />
                        <span className="ml-3 text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {field.type === 'searchable_multi_select' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange, value, ref } }) => (
                      <Select
                        inputRef={ref}
                        isMulti
                        options={(field.options || []).map(opt => ({ label: opt, value: opt }))}
                        value={(value || []).map(v => ({ label: v, value: v }))}
                        onChange={vals => onChange(vals ? vals.map(v => v.value) : [])}
                        isClearable
                        placeholder={field.placeholder || "Select options..."}
                        styles={reactSelectPatientStyles}
                      />
                    )}
                  />
                )}

                {field.type === 'file' && (
                  <input
                    type="file"
                    className="border border-gray-300 p-2.5 rounded-lg bg-white w-full text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition"
                    {...register(field.id, validationRules)}
                  />
                )}

                {field.type === 'image' && (
                  <input
                    type="file"
                    accept="image/*"
                    className="border border-gray-300 p-2.5 rounded-lg bg-white w-full text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition"
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
                            className={`text-4xl focus:outline-none transition ${value > i ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
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
                          <div className="flex justify-between text-xs text-gray-500 mb-3 font-bold uppercase tracking-wider">
                            <span>{field.scale?.minLabel || 'Poor'}</span>
                            <span>{field.scale?.maxLabel || 'Excellent'}</span>
                          </div>
                          <div className="flex justify-between items-center gap-1 bg-white p-3 border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
                            {options.map(opt => (
                              <label key={opt} className="flex flex-col items-center gap-2 cursor-pointer flex-1 group min-w-[30px]">
                                <input type="radio" name={field.id} value={opt} onChange={() => onChange(opt)} checked={value === opt} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                                <span className={`text-sm font-semibold transition ${value === opt ? 'text-green-600' : 'text-gray-500 group-hover:text-green-500'}`}>{opt}</span>
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
                      <div className="border border-gray-300 rounded-lg bg-white overflow-hidden shadow-inner">
                        <SignatureCanvas
                          penColor="black"
                          canvasProps={{ className: 'w-full h-40 bg-gray-50 cursor-crosshair' }}
                          onEnd={function () { onChange(this.toDataURL()); }}
                        />
                        <div className="bg-gray-100 px-4 py-2.5 text-xs text-gray-500 border-t border-gray-200 font-medium uppercase tracking-wider text-right">Sign inside the box</div>
                      </div>
                    )}
                  />
                )}

                {field.type === 'qr_scanner' && (
                  <Controller
                    name={field.id}
                    control={control}
                    rules={validationRules}
                    render={({ field: { onChange } }) => (
                      <QRScannerComponent field={field} onChange={onChange} setValue={setValue} />
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

                {field.type === 'section_header' && <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">{field.label}</h2>}
                {field.type === 'instruction' && <p className="text-gray-700 bg-blue-50 p-5 rounded-xl border border-blue-100 text-[15px] leading-relaxed">{field.description}</p>}
                {field.type === 'divider' && <hr className="border-gray-200 my-6 border-t-2" />}

                {errors[field.id] && <span className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {errors[field.id].message}</span>}
              </div>
            );
          })}

          {isTerminated && (
            <div className="mt-8 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span className="font-semibold text-[15px]">Form completed based on responses.</span>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 mt-8 flex justify-between gap-4">
            {currentPageIndex > 0 ? (
              <button type="button" onClick={handlePrevPage} className="flex-1 bg-gray-100 text-gray-700 px-6 py-3.5 rounded-xl font-bold text-lg hover:bg-gray-200 transition">
                Previous
              </button>
            ) : <div></div>}

            <button type="submit" className={`flex-1 text-white px-6 py-3.5 rounded-xl font-bold text-lg transition shadow-md hover:shadow-lg ${isTerminated ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {isTerminated ? 'End & Submit Form' : (currentPageIndex < totalPages - 1 ? 'Next' : 'Submit Form')}
            </button>
          </div>
        </form>
      </div>
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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/forms" element={<Dashboard />} />
        <Route path="/fill/:id" element={<FormRenderer />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}

export default App;
