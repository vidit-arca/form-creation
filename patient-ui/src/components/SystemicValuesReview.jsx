import React, { useState, useMemo } from 'react';
import {
  Heart,
  Scale,
  Activity,
  ShieldCheck,
  AlertTriangle,
  User,
  MapPin,
  Clock,
  Printer,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Edit3,
  FileCheck2,
} from 'lucide-react';
import {
  CLINICAL_REFERENCE_STANDARDS,
  matchClinicalStandard,
  classifyFieldDomain,
} from '../utils/clinicalStandards';

export function SystemicValuesReview({
  formConfig,
  pages,
  getValues,
  onJumpToPage,
  context,
  signatureData,
}) {
  const [showAllObservations, setShowAllObservations] = useState(false);

  // Group fields into physiological domains with page index mapping for fast edits
  const groupedData = useMemo(() => {
    const groups = {
      hemodynamics: [],
      anthropometrics: [],
      metabolic: [],
      scores: [],
      demographics: [],
      attestation: [],
      general: [],
    };

    let criticalAlertsCount = 0;
    const criticalList = [];

    // Traverse all pages and fields
    pages.forEach((page, pIdx) => {
      (page.fields || []).forEach((field) => {
        if (['page_break', 'section_header', 'instruction', 'divider'].includes(field.type)) return;

        const val = getValues(field.id);
        const domain = classifyFieldDomain(field);
        const standardKey = matchClinicalStandard(field.id, field.label, field.type);
        const standardDef = standardKey ? CLINICAL_REFERENCE_STANDARDS[standardKey] : null;

        let evalResult = null;
        if (standardDef && val !== undefined && val !== null && val !== '') {
          // If BMI component, extract bmi score
          if (field.type === 'bmi' && typeof val === 'object') {
            evalResult = standardDef.evaluate(val.bmi);
          } else {
            evalResult = standardDef.evaluate(val);
          }
        }

        if (evalResult?.critical) {
          criticalAlertsCount++;
          criticalList.push({
            label: field.label,
            value: typeof val === 'object' ? (val.bmi ?? JSON.stringify(val)) : val,
            unit: standardDef?.unit || '',
            statusText: evalResult.text,
            pageIndex: pIdx,
          });
        }

        const item = {
          field,
          value: val,
          pageIndex: pIdx,
          standardKey,
          standardDef,
          evalResult,
        };

        if (groups[domain]) {
          groups[domain].push(item);
        } else {
          groups.general.push(item);
        }
      });
    });

    return {
      groups,
      criticalAlertsCount,
      criticalList,
    };
  }, [pages, formConfig, getValues]);

  // Formatter for general and complex field values
  const formatValueDisplay = (field, val, standardDef) => {
    if (val === undefined || val === null || val === '') {
      return <span className="text-slate-400 italic font-mono text-xs">Not recorded</span>;
    }
    if (typeof val === 'boolean') {
      return <span className="font-mono font-bold text-xs">{val ? 'Yes' : 'No'}</span>;
    }
    if (Array.isArray(val)) {
      return val.length > 0 ? (
        <span className="font-medium text-slate-800">{val.join(', ')}</span>
      ) : (
        <span className="text-slate-400 italic font-mono text-xs">None</span>
      );
    }
    if (field.type === 'bmi' && typeof val === 'object') {
      return (
        <div className="font-mono">
          <span className="text-base font-extrabold text-slate-950 tabular-nums">
            {val.bmi ?? '—'}
          </span>
          <span className="text-xs text-slate-500 font-sans ml-1">kg/m²</span>
          {val.category && (
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {val.category}
            </span>
          )}
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">
            Height: {val.height || '—'} cm · Weight: {val.weight || '—'} kg
          </div>
        </div>
      );
    }
    if (field.type === 'dob_age' && typeof val === 'object') {
      return (
        <div className="font-mono">
          <span className="text-sm font-bold text-slate-900">{val.age} yrs</span>
          {val.dob && <span className="text-xs text-slate-500 ml-2">(DOB: {val.dob})</span>}
        </div>
      );
    }
    if (field.type === 'gps' && typeof val === 'object') {
      return (
        <span className="font-mono text-xs text-slate-700">
          {Number(val.lat).toFixed(4)}°N, {Number(val.lng).toFixed(4)}°E
        </span>
      );
    }
    if (field.type === 'cohort_input' && typeof val === 'object') {
      return (
        <div className="font-mono">
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            {val.cohortTier || 'Cohort Active'}
          </span>
          <span className="text-xs text-slate-500 ml-2">
            ({val.gender || 'All'}, {val.age} yrs)
          </span>
        </div>
      );
    }
    if (field.type === 'dietary_recall_24h' && typeof val === 'object') {
      const meals = Object.entries(val).filter(([_, items]) => items && items.length > 0);
      if (!meals.length) return <span className="text-slate-400 italic font-mono text-xs">No recall entries</span>;
      return (
        <div className="space-y-1 text-xs">
          {meals.map(([meal, items]) => (
            <div key={meal}>
              <span className="font-semibold text-slate-800">{meal}:</span>{' '}
              <span className="text-slate-600">
                {items.map((i) => (typeof i === 'string' ? i : i.name)).join(', ')}
              </span>
            </div>
          ))}
        </div>
      );
    }
    if (field.type === 'signature') {
      return val ? (
        <img
          src={val}
          alt="Signature"
          className="h-12 border border-slate-200 rounded-lg bg-white p-1"
        />
      ) : (
        <span className="text-slate-400 italic font-mono text-xs">Not signed</span>
      );
    }

    // Default numeric or text rendering
    const unit = standardDef?.unit || field.unit || '';
    return (
      <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
        {String(val)}
        {unit && <span className="text-xs font-sans text-slate-500 font-normal ml-1">{unit}</span>}
      </span>
    );
  };

  const renderStatusBadge = (evalResult) => {
    if (!evalResult) return null;
    const { status, text } = evalResult;

    if (status === 'optimal') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{text}</span>
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>{text}</span>
        </span>
      );
    }
    if (status === 'alert') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-900 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-300 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          <span>{text}</span>
        </span>
      );
    }
    return null;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn font-sans">
      {/* ─── Top Pre-Submission Clinical Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wider">
              STAGE 4 · CLINICAL DOCKET REVIEW
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-[11px] text-slate-500">PRE-TRANSMISSION AUDIT</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
            Systemic Clinical Values Review
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Please review physiological measurements, vital telemetry, and participant inputs before final signature and central registry submission.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-50 text-xs font-semibold cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print Case Docket</span>
        </button>
      </div>

      {/* ─── Critical Alert Warning Bar (if thresholds breached) ─── */}
      {groupedData.criticalAlertsCount > 0 && (
        <div className="radiant-card p-4 rounded-xl bg-rose-50/90 border border-rose-300/80 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-rose-950 flex items-center gap-2">
              <span>
                {groupedData.criticalAlertsCount}{' '}
                {groupedData.criticalAlertsCount === 1 ? 'Critical Value' : 'Critical Values'} Detected
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-900 font-bold">
                ATTENTION REQUIRED
              </span>
            </div>
            <p className="text-rose-800 text-[11px] leading-relaxed">
              One or more physiological observations exceed standard clinical safety thresholds:
            </p>
            <ul className="list-disc list-inside text-rose-900 space-y-0.5 pt-1 font-mono text-[11px]">
              {groupedData.criticalList.map((crit, idx) => (
                <li key={idx}>
                  <strong>{crit.label}:</strong> {String(crit.value)} {crit.unit} —{' '}
                  <span className="font-bold underline">{crit.statusText}</span>
                  <button
                    type="button"
                    onClick={() => onJumpToPage(crit.pageIndex)}
                    className="ml-2 text-rose-700 hover:text-rose-950 font-sans font-semibold underline text-[10px] cursor-pointer"
                  >
                    Edit Value →
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ─── Demographics & Study Metadata Quick Strip ─── */}
      {groupedData.groups.demographics.length > 0 && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 font-mono text-slate-800 font-bold">
            <User className="w-3.5 h-3.5 text-teal-600" />
            <span>PARTICIPANT CONTEXT:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-600 font-mono text-[11px]">
            {groupedData.groups.demographics.map((item) => (
              <div key={item.field.id} className="flex items-center gap-1.5">
                <span className="text-slate-400 uppercase">{item.field.label}:</span>
                <span className="font-bold text-slate-900">
                  {formatValueDisplay(item.field, item.value, item.standardDef)}
                </span>
              </div>
            ))}
            {context?.site && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>SITE: {context.site}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Primary 2-Column Physiological Matrix ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── 1. Hemodynamics & Vital Signs Panel ── */}
        <div className="radiant-card rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Heart className="w-4 h-4 text-rose-500" />
                <span className="uppercase font-mono tracking-wide">Hemodynamics &amp; Vital Signs</span>
              </div>
              {groupedData.groups.hemodynamics.length > 0 && (
                <button
                  type="button"
                  onClick={() => onJumpToPage(groupedData.groups.hemodynamics[0]?.pageIndex ?? 0)}
                  className="text-teal-700 hover:text-teal-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {groupedData.groups.hemodynamics.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic font-mono">
                  No vital signs recorded in this questionnaire.
                </div>
              ) : (
                groupedData.groups.hemodynamics.map((item) => (
                  <div
                    key={item.field.id}
                    className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                        {item.field.label}
                      </div>
                      <div className="mt-0.5">
                        {formatValueDisplay(item.field, item.value, item.standardDef)}
                      </div>
                    </div>
                    {renderStatusBadge(item.evalResult)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── 2. Anthropometrics & Body Composition Panel ── */}
        <div className="radiant-card rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Scale className="w-4 h-4 text-blue-600" />
                <span className="uppercase font-mono tracking-wide">Anthropometrics &amp; BMI</span>
              </div>
              {groupedData.groups.anthropometrics.length > 0 && (
                <button
                  type="button"
                  onClick={() => onJumpToPage(groupedData.groups.anthropometrics[0]?.pageIndex ?? 0)}
                  className="text-teal-700 hover:text-teal-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {groupedData.groups.anthropometrics.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic font-mono">
                  No anthropometric measurements captured.
                </div>
              ) : (
                groupedData.groups.anthropometrics.map((item) => (
                  <div
                    key={item.field.id}
                    className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                        {item.field.label}
                      </div>
                      <div className="mt-0.5">
                        {formatValueDisplay(item.field, item.value, item.standardDef)}
                      </div>
                    </div>
                    {renderStatusBadge(item.evalResult)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── 3. Metabolic & Laboratory Biomarkers Panel ── */}
        <div className="radiant-card rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Activity className="w-4 h-4 text-teal-600" />
                <span className="uppercase font-mono tracking-wide">Metabolic &amp; Lab Biomarkers</span>
              </div>
              {groupedData.groups.metabolic.length > 0 && (
                <button
                  type="button"
                  onClick={() => onJumpToPage(groupedData.groups.metabolic[0]?.pageIndex ?? 0)}
                  className="text-teal-700 hover:text-teal-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {groupedData.groups.metabolic.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic font-mono">
                  No metabolic or lab biomarkers assigned.
                </div>
              ) : (
                groupedData.groups.metabolic.map((item) => (
                  <div
                    key={item.field.id}
                    className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                        {item.field.label}
                      </div>
                      <div className="mt-0.5">
                        {formatValueDisplay(item.field, item.value, item.standardDef)}
                      </div>
                    </div>
                    {renderStatusBadge(item.evalResult)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── 4. Calculated Clinical Scores & Cohort Panel ── */}
        <div className="radiant-card rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="uppercase font-mono tracking-wide">Calculated Scores &amp; Cohort</span>
              </div>
              {groupedData.groups.scores.length > 0 && (
                <button
                  type="button"
                  onClick={() => onJumpToPage(groupedData.groups.scores[0]?.pageIndex ?? 0)}
                  className="text-teal-700 hover:text-teal-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {groupedData.groups.scores.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic font-mono">
                  No calculated composite scores in this form.
                </div>
              ) : (
                groupedData.groups.scores.map((item) => (
                  <div
                    key={item.field.id}
                    className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                        {item.field.label}
                      </div>
                      <div className="mt-0.5">
                        {formatValueDisplay(item.field, item.value, item.standardDef)}
                      </div>
                    </div>
                    {renderStatusBadge(item.evalResult)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Digital Signature & Clinical Verification Docket ─── */}
      <div className="radiant-card p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 font-mono text-[11px]">
              DATA INTEGRITY &amp; ATTESTATION
            </div>
            <div className="text-slate-500 text-[11px] font-mono mt-0.5">
              Protocol answers encrypted in buffer · Ready for cryptographic sign-off.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST</span>
          </div>
          <span>•</span>
          <span className="text-emerald-700 font-semibold">VAULT SECURE</span>
        </div>
      </div>

      {/* ─── Collapsible: Additional Clinical Responses ─── */}
      {groupedData.groups.general.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white/60">
          <button
            type="button"
            onClick={() => setShowAllObservations(!showAllObservations)}
            className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[10px]">
                {groupedData.groups.general.length} OBSERVATIONS
              </span>
              <span>Additional Clinical Questionnaire Responses</span>
            </div>
            {showAllObservations ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showAllObservations && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                {groupedData.groups.general.map((item) => (
                  <div key={item.field.id} className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                      {item.field.label}
                    </span>
                    <div className="mt-1">
                      {formatValueDisplay(item.field, item.value, item.standardDef)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

