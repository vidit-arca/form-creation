import React, { useState } from 'react';
import {
  X,
  FileText,
  Clock,
  User,
  Shield,
  Layers,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

export function AuditDiffModal({ event, onClose }) {
  const [activeTab, setActiveTab] = useState('diff'); // 'diff' | 'raw'
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const stateDiff = event.state_diff || {};
  const beforeState = event.before_state;
  const afterState = event.after_state;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderDiffSection = () => {
    const hasDiff =
      stateDiff &&
      ((stateDiff.modified && Object.keys(stateDiff.modified).length > 0) ||
        (stateDiff.added && Object.keys(stateDiff.added).length > 0) ||
        (stateDiff.removed && Object.keys(stateDiff.removed).length > 0) ||
        (Array.isArray(stateDiff.added_items) && stateDiff.added_items.length > 0) ||
        (Array.isArray(stateDiff.removed_items) && stateDiff.removed_items.length > 0));

    if (!hasDiff) {
      if (!beforeState && afterState) {
        return (
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 font-mono">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>INITIAL RESOURCE CREATION (NO PRIOR STATE)</span>
            </div>
            <pre className="text-xs font-mono bg-white p-3 rounded-lg border border-emerald-200 text-slate-800 overflow-x-auto">
              {JSON.stringify(afterState, null, 2)}
            </pre>
          </div>
        );
      }

      if (beforeState && !afterState) {
        return (
          <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-900 font-mono">
              <MinusCircle className="w-4 h-4 text-rose-600" />
              <span>RESOURCE DELETED / ARCHIVED</span>
            </div>
            <pre className="text-xs font-mono bg-white p-3 rounded-lg border border-rose-200 text-slate-800 overflow-x-auto">
              {JSON.stringify(beforeState, null, 2)}
            </pre>
          </div>
        );
      }

      return (
        <div className="text-center py-10 text-xs font-mono text-slate-400 italic">
          No field-level mutations recorded for this event.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Modified Properties */}
        {stateDiff.modified && Object.keys(stateDiff.modified).length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-amber-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Modified Attributes ({Object.keys(stateDiff.modified).length})</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {Object.entries(stateDiff.modified).map(([key, change]) => (
                <div key={key} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-slate-700 w-48 shrink-0">{key}</span>
                  <div className="flex items-center gap-3 font-mono text-[11px] flex-1">
                    <span className="px-2 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200/60 line-through">
                      {typeof change?.from === 'object' ? JSON.stringify(change.from) : String(change?.from ?? 'null')}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-bold">
                      {typeof change?.to === 'object' ? JSON.stringify(change.to) : String(change?.to ?? 'null')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Added Properties */}
        {stateDiff.added && Object.keys(stateDiff.added).length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-emerald-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Added Attributes / Properties</span>
            </div>
            <div className="p-3 bg-emerald-50/50 border border-emerald-200/70 rounded-xl space-y-1 font-mono text-xs">
              {Object.entries(stateDiff.added).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">+ {key}:</span>
                  <span className="text-slate-900 font-semibold">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Removed Properties */}
        {stateDiff.removed && Object.keys(stateDiff.removed).length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-rose-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Removed Attributes</span>
            </div>
            <div className="p-3 bg-rose-50/50 border border-rose-200/70 rounded-xl space-y-1 font-mono text-xs">
              {Object.entries(stateDiff.removed).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-rose-700 font-bold">- {key}:</span>
                  <span className="text-slate-600 line-through">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="radiant-card rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl bg-white border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200/80 flex items-start justify-between gap-4 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/70 uppercase">
                {event.category}
              </span>
              <span className="font-mono text-xs font-bold text-slate-950">{event.action}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  event.status === 'SUCCESS'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {event.status}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-950">
              {event.entity_name || event.entity_id || 'System Activity Record'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-white cursor-pointer transition text-xs flex items-center gap-1"
              title="Copy JSON Payload"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-[11px] font-mono">{copied ? 'Copied' : 'JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audit Metadata Context Strip */}
        <div className="px-5 py-3 bg-slate-100/60 border-b border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono text-slate-600">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Actor</span>
            <span className="font-bold text-slate-900">{event.actor_name || event.actor_email}</span>
            <span className="text-slate-500 block text-[10px]">({event.actor_role})</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Timestamp (UTC)</span>
            <span className="font-semibold text-slate-800">{new Date(event.timestamp).toUTCString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Service Origin</span>
            <span className="font-semibold text-slate-800">{event.service_origin}</span>
            {event.ip_address && <span className="text-slate-500 block text-[10px]">IP: {event.ip_address}</span>}
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Target Entity</span>
            <span className="font-semibold text-slate-800">{event.entity_type}</span>
            <span className="text-slate-500 block text-[10px] truncate">ID: {event.entity_id}</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-200 flex items-center gap-4 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('diff')}
            className={`pb-2.5 transition cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'diff'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>State Diff Delta</span>
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`pb-2.5 transition cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'raw'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Side-by-Side Raw State</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto max-h-[50vh]">
          {activeTab === 'diff' ? (
            renderDiffSection()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">
                  Before State (Prior)
                </span>
                <pre className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 overflow-x-auto max-h-72">
                  {beforeState ? JSON.stringify(beforeState, null, 2) : '// No prior state recorded'}
                </pre>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">
                  After State (Resulting)
                </span>
                <pre className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 overflow-x-auto max-h-72">
                  {afterState ? JSON.stringify(afterState, null, 2) : '// No post state recorded'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Event UUID: {event.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 cursor-pointer shadow-xs"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

