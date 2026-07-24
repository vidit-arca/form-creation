import React, { useEffect, useState } from 'react';

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

export function SettingsPanel({ activeField, activeFieldId, setActiveFieldId, updateField, updateFieldId, schemaData, setSchemaData }) {
  const [isManualVariable, setIsManualVariable] = useState(false);

  useEffect(() => {
    // Reset manual state when active field changes
    setIsManualVariable(false);
  }, [activeFieldId]);
  if (!activeField) {
    return (
      <div className="w-80 bg-white shadow-xl border-l border-gray-200 flex flex-col z-20">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-lg text-gray-800">Field Settings</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-gray-500 text-sm text-center mt-10">Select a field to edit its properties.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white shadow-xl border-l border-gray-200 flex flex-col z-20">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="font-bold text-lg text-gray-800">Field Settings</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Field Key / ID</label>
            <input
              className="text-sm bg-gray-50 border border-gray-200 p-2 rounded w-full font-mono outline-none focus:ring-2 focus:ring-blue-500"
              value={activeField.id}
              onChange={(e) => updateFieldId(activeField.id, e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            />
          </div>

          {['page_break', 'section_header', 'instruction', 'divider'].includes(activeField.type) ? (
            <>
              {activeField.type !== 'divider' && (
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">{activeField.type === 'page_break' ? 'Section Title' : 'Text / Heading'}</label>
                  <input
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={activeField.label}
                    onChange={(e) => updateField(activeField.id, { label: e.target.value })}
                  />
                </div>
              )}
              {activeField.type === 'page_break' && (
                <div className="mt-4">
                  <label className="text-sm font-bold text-gray-700 block mb-2">Section Description</label>
                  <textarea
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={activeField.description || ''}
                    onChange={(e) => updateField(activeField.id, { description: e.target.value })}
                    rows="3"
                  />
                </div>
              )}
              {activeField.type === 'instruction' && (
                <div className="mt-4">
                  <label className="text-sm font-bold text-gray-700 block mb-2">Instruction Body</label>
                  <textarea
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={activeField.description || ''}
                    onChange={(e) => updateField(activeField.id, { description: e.target.value })}
                    rows="3"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">Label / Question</label>
                <input
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={activeField.label}
                  onChange={(e) => {
                    const newLabel = e.target.value;
                    const updates = { label: newLabel };

                    // Auto-slug if not manual
                    if (!isManualVariable && !activeField.variableNameSetExplicitly) {
                      updates.variableName = slugify(newLabel);
                    }

                    updateField(activeField.id, updates);
                  }}
                />
              </div>

              <div className="mt-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Database Variable Name (Slug)</label>
                <div className="relative">
                  <input
                    className="w-full border border-gray-300 p-2.5 pl-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs bg-gray-50"
                    value={activeField.variableName || slugify(activeField.label || '')}
                    onChange={(e) => {
                      setIsManualVariable(true);
                      updateField(activeField.id, {
                        variableName: slugify(e.target.value),
                        variableNameSetExplicitly: true
                      });
                    }}
                    placeholder="e.g. patient_age"
                  />
                  <div className="mt-1 text-[10px] text-gray-500 italic">
                    This will be the key used in your database results.
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-bold text-gray-700 block mb-2">Placeholder Text</label>
                <input
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={activeField.placeholder || ''}
                  onChange={(e) => updateField(activeField.id, { placeholder: e.target.value })}
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-bold text-gray-700 block mb-2">Help Text</label>
                <input
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={activeField.helpText || ''}
                  onChange={(e) => updateField(activeField.id, { helpText: e.target.value })}
                />
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-3 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded"
                    checked={activeField.required}
                    onChange={(e) => updateField(activeField.id, { required: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-gray-700">Required Field</span>
                </label>
              </div>

              <div className="border-t border-gray-100 pt-6 mt-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Validation Constraints</h3>
                {['text', 'phone', 'email'].includes(activeField.type) && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-600 block mb-1">Min Length</label>
                        <input type="number" className="w-full border border-gray-300 p-2 rounded-lg" value={activeField.validation?.minLength || ''} onChange={(e) => updateField(activeField.id, { validation: { ...activeField.validation, minLength: e.target.value } })} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-600 block mb-1">Max Length</label>
                        <input type="number" className="w-full border border-gray-300 p-2 rounded-lg" value={activeField.validation?.maxLength || ''} onChange={(e) => updateField(activeField.id, { validation: { ...activeField.validation, maxLength: e.target.value } })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Regex Pattern</label>
                      <input type="text" className="w-full border border-gray-300 p-2 rounded-lg font-mono text-sm" placeholder={activeField.type === 'phone' ? "^\\+?[0-9]{10,15}$" : "^[a-zA-Z]+$"} value={activeField.validation?.pattern || ''} onChange={(e) => updateField(activeField.id, { validation: { ...activeField.validation, pattern: e.target.value } })} />
                    </div>
                  </div>
                )}
                {activeField.type === 'number' && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-600 block mb-1">Min Value</label>
                      <input type="number" className="w-full border border-gray-300 p-2 rounded-lg" value={activeField.validation?.min || ''} onChange={(e) => updateField(activeField.id, { validation: { ...activeField.validation, min: e.target.value } })} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-600 block mb-1">Max Value</label>
                      <input type="number" className="w-full border border-gray-300 p-2 rounded-lg" value={activeField.validation?.max || ''} onChange={(e) => updateField(activeField.id, { validation: { ...activeField.validation, max: e.target.value } })} />
                    </div>
                  </div>
                )}
                {activeField.type === 'textarea' && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Max Word Count</label>
                    <input type="number" className="w-full border border-gray-300 p-2 rounded-lg" value={activeField.validation?.maxWords || ''} onChange={(e) => updateField(activeField.id, { validation: { ...activeField.validation, maxWords: e.target.value } })} />
                  </div>
                )}

                {/* ── Date Validation ─────────────────────────────────── */}
                {['date'].includes(activeField.type) && (
                  <div className="space-y-3">
                    {/* Min Date */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Earliest Allowed Date</label>
                      <select
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm mb-1"
                        value={activeField.validation?.minDatePreset || 'none'}
                        onChange={(e) => {
                          const preset = e.target.value;
                          updateField(activeField.id, {
                            validation: { ...activeField.validation, minDatePreset: preset, minDate: preset === 'custom' ? (activeField.validation?.minDate || '') : preset }
                          });
                        }}
                      >
                        <option value="none">No Limit</option>
                        <option value="today">Today (dynamic — blocks past dates)</option>
                        <option value="custom">Custom Date</option>
                      </select>
                      {activeField.validation?.minDatePreset === 'custom' && (
                        <input
                          type="date"
                          className="w-full border border-blue-300 p-2 rounded-lg text-sm bg-blue-50"
                          value={activeField.validation?.minDate || ''}
                          onChange={(e) => updateField(activeField.id, { validation: { ...activeField.validation, minDate: e.target.value } })}
                        />
                      )}
                      {activeField.validation?.minDatePreset === 'today' && (
                        <p className="text-xs text-blue-600 mt-1">📅 Patient cannot select a past date — minimum is always today's date.</p>
                      )}
                    </div>

                    {/* Max Date */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Latest Allowed Date</label>
                      <select
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm mb-1"
                        value={activeField.validation?.maxDatePreset || 'none'}
                        onChange={(e) => {
                          const preset = e.target.value;
                          updateField(activeField.id, {
                            validation: { ...activeField.validation, maxDatePreset: preset, maxDate: preset === 'custom' ? (activeField.validation?.maxDate || '') : preset }
                          });
                        }}
                      >
                        <option value="none">No Limit</option>
                        <option value="today">Today (dynamic — blocks future dates)</option>
                        <option value="custom">Custom Date</option>
                      </select>
                      {activeField.validation?.maxDatePreset === 'custom' && (
                        <input
                          type="date"
                          className="w-full border border-blue-300 p-2 rounded-lg text-sm bg-blue-50"
                          value={activeField.validation?.maxDate || ''}
                          onChange={(e) => updateField(activeField.id, { validation: { ...activeField.validation, maxDate: e.target.value } })}
                        />
                      )}
                      {activeField.validation?.maxDatePreset === 'today' && (
                        <p className="text-xs text-orange-600 mt-1">📅 Patient cannot select a future date — maximum is always today's date.</p>
                      )}
                    </div>

                    {/* Quick Presets */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quick Presets</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded-md bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition"
                          onClick={() => updateField(activeField.id, { validation: { ...activeField.validation, minDatePreset: 'none', minDate: '', maxDatePreset: 'today', maxDate: 'today' } })}
                        >
                          📅 Past Only (e.g. Date of Birth)
                        </button>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition"
                          onClick={() => updateField(activeField.id, { validation: { ...activeField.validation, minDatePreset: 'today', minDate: 'today', maxDatePreset: 'none', maxDate: '' } })}
                        >
                          📅 Future Only (e.g. Follow-up Date)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Year-only (number field) Validation ─────────────── */}
                {activeField.type === 'number' && activeField.label?.toLowerCase().includes('year') && (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 mt-2">
                    <p className="text-xs font-bold text-amber-700 mb-1">💡 Year Field Tip</p>
                    <p className="text-xs text-amber-600 mb-2">Set Min/Max above to restrict the year range. For "must not exceed current year", set Max Value to the current year.</p>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded-md bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition"
                      onClick={() => updateField(activeField.id, { validation: { ...activeField.validation, max: new Date().getFullYear() } })}
                    >
                      Set Max = {new Date().getFullYear()} (Current Year)
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {['dropdown', 'radio', 'multi_select', 'gender', 'checkbox', 'searchable_dropdown', 'searchable_multi_select'].includes(activeField.type) && (
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700 block">Options (Choices)</label>
                {activeField.type !== 'gender' && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-600">
                    <input type="checkbox" checked={activeField.enableScoring || false} onChange={e => updateField(activeField.id, { enableScoring: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />
                    Enable Scoring
                  </label>
                )}
              </div>
              <div className="space-y-2 mb-3">
                {(activeField.options || []).map((opt, i) => {
                  const hasCondition = !!(activeField.optionConditions?.[opt]?.fieldId);
                  const conditionKey = `optCondOpen_${i}`;
                  const isOpen = activeField._openOptCond === opt;
                  const allFields = Array.isArray(schemaData) ? schemaData : [];
                  const sourceField = allFields.find(f => f.id === activeField.optionConditions?.[opt]?.fieldId);

                  return (
                    <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Option row */}
                      <div className="flex gap-2 items-center p-2 bg-white">
                        <input
                          className="flex-1 border border-gray-300 p-2 rounded-lg text-sm"
                          value={opt}
                          onChange={(e) => {
                            const newVal = e.target.value;
                            const newOptions = [...activeField.options];
                            newOptions[i] = newVal;
                            let newOptionScores = { ...(activeField.optionScores || {}) };
                            let newOptionConditions = { ...(activeField.optionConditions || {}) };
                            if (activeField.enableScoring && newOptionScores[opt] !== undefined) {
                              newOptionScores[newVal] = newOptionScores[opt];
                              delete newOptionScores[opt];
                            }
                            if (newOptionConditions[opt]) {
                              newOptionConditions[newVal] = newOptionConditions[opt];
                              delete newOptionConditions[opt];
                            }
                            updateField(activeField.id, { options: newOptions, optionScores: newOptionScores, optionConditions: newOptionConditions });
                          }}
                        />
                        {activeField.enableScoring && (
                          <input
                            type="number"
                            className="w-16 border border-gray-300 p-2 rounded-lg text-sm bg-blue-50 border-blue-200 focus:ring-blue-500 outline-none"
                            placeholder="Score"
                            value={activeField.optionScores?.[opt] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              updateField(activeField.id, { optionScores: { ...(activeField.optionScores || {}), [opt]: val } });
                            }}
                          />
                        )}
                        {/* Condition toggle button */}
                        <button
                          type="button"
                          title={hasCondition ? `Condition: show when ${sourceField?.label || '?'} ${activeField.optionConditions?.[opt]?.operator} ${activeField.optionConditions?.[opt]?.value}` : 'Add show/hide condition for this option'}
                          className={`p-1.5 rounded-lg border text-xs transition ${hasCondition ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-300'}`}
                          onClick={() => updateField(activeField.id, { _openOptCond: isOpen ? null : opt })}
                        >
                          🔗
                        </button>
                        <button
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 text-xs"
                          onClick={() => {
                            const newOptions = activeField.options.filter((_, idx) => idx !== i);
                            const newOptionScores = { ...(activeField.optionScores || {}) };
                            const newOptionConditions = { ...(activeField.optionConditions || {}) };
                            delete newOptionScores[opt];
                            delete newOptionConditions[opt];
                            updateField(activeField.id, { options: newOptions, optionScores: newOptionScores, optionConditions: newOptionConditions });
                          }}
                        >✕</button>
                      </div>

                      {/* Inline condition editor */}
                      {isOpen && (
                        <div className="bg-purple-50 border-t border-purple-200 p-3 space-y-2">
                          <p className="text-xs font-bold text-purple-700 mb-1">Show "<span className="italic">{opt}</span>" only when:</p>
                          <div className="flex gap-2 flex-wrap">
                            {/* Source field picker */}
                            <select
                              className="flex-1 min-w-0 border border-purple-200 p-1.5 rounded-md text-xs bg-white"
                              value={activeField.optionConditions?.[opt]?.fieldId || ''}
                              onChange={(e) => {
                                updateField(activeField.id, {
                                  optionConditions: {
                                    ...(activeField.optionConditions || {}),
                                    [opt]: { ...(activeField.optionConditions?.[opt] || { operator: '==', value: '' }), fieldId: e.target.value }
                                  }
                                });
                              }}
                            >
                              <option value="">— Pick a field —</option>
                              {allFields.filter(f => f.id !== activeField.id && ['dropdown','radio','gender','searchable_dropdown','text','number'].includes(f.type)).map(f => (
                                <option key={f.id} value={f.id}>{f.label || f.id}</option>
                              ))}
                            </select>
                            {/* Operator */}
                            <select
                              className="w-20 border border-purple-200 p-1.5 rounded-md text-xs bg-white"
                              value={activeField.optionConditions?.[opt]?.operator || '=='}
                              onChange={(e) => {
                                updateField(activeField.id, {
                                  optionConditions: {
                                    ...(activeField.optionConditions || {}),
                                    [opt]: { ...(activeField.optionConditions?.[opt] || { fieldId: '', value: '' }), operator: e.target.value }
                                  }
                                });
                              }}
                            >
                              <option value="==">= equals</option>
                              <option value="!=">≠ not equals</option>
                            </select>
                            {/* Expected value */}
                            {(sourceField?.options?.length > 0 || sourceField?.type === 'gender') ? (
                              <select
                                className="flex-1 min-w-0 border border-purple-200 p-1.5 rounded-md text-xs bg-white"
                                value={activeField.optionConditions?.[opt]?.value || ''}
                                onChange={(e) => {
                                  updateField(activeField.id, {
                                    optionConditions: {
                                      ...(activeField.optionConditions || {}),
                                      [opt]: { ...(activeField.optionConditions?.[opt] || { fieldId: '', operator: '==' }), value: e.target.value }
                                    }
                                  });
                                }}
                              >
                                <option value="">— Pick value —</option>
                                {(sourceField.options?.length > 0 ? sourceField.options : (sourceField.type === 'gender' ? ['Male','Female','Other','Prefer not to say'] : [])).map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="value"
                                className="flex-1 min-w-0 border border-purple-200 p-1.5 rounded-md text-xs bg-white"
                                value={activeField.optionConditions?.[opt]?.value || ''}
                                onChange={(e) => {
                                  updateField(activeField.id, {
                                    optionConditions: {
                                      ...(activeField.optionConditions || {}),
                                      [opt]: { ...(activeField.optionConditions?.[opt] || { fieldId: '', operator: '==' }), value: e.target.value }
                                    }
                                  });
                                }}
                              />
                            )}
                          </div>
                          {/* Clear condition */}
                          {hasCondition && (
                            <button
                              type="button"
                              className="text-xs text-red-500 hover:underline"
                              onClick={() => {
                                const newConds = { ...(activeField.optionConditions || {}) };
                                delete newConds[opt];
                                updateField(activeField.id, { optionConditions: newConds, _openOptCond: null });
                              }}
                            >✕ Remove condition</button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                onClick={() => {
                  const newOptName = `Option ${(activeField.options?.length || 0) + 1}`;
                  updateField(activeField.id, {
                    options: [...(activeField.options || []), newOptName],
                    optionScores: { ...(activeField.optionScores || {}), [newOptName]: 0 }
                  });
                }}
              >
                + Add Option
              </button>

              {/* Exclusive Stop Criteria Settings */}
              {['dropdown', 'radio', 'multi_select', 'searchable_dropdown', 'searchable_multi_select'].includes(activeField.type) && (
                <div className="mt-6 pt-4 border-t border-red-100 bg-red-50/30 -mx-6 px-6 pb-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-red-800 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Exclusive Stop Criteria
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={activeField.enableExclusiveStop || false} onChange={e => updateField(activeField.id, { enableExclusiveStop: e.target.checked, exclusiveStopOptions: e.target.checked ? activeField.exclusiveStopOptions || [] : [] })} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>

                  {activeField.enableExclusiveStop && (
                    <div className="space-y-2 mt-3">
                      <p className="text-xs text-red-600/80 mb-2 leading-relaxed">Select options that will immediately terminate the form. All subsequent questions and sections will be skipped.</p>
                      {(activeField.options || []).map((opt, i) => {
                        const isStop = activeField.exclusiveStopOptions?.includes(opt);
                        return (
                          <label key={i} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${isStop ? 'bg-red-100 border-red-300 text-red-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                              checked={isStop}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                let newStops = [...(activeField.exclusiveStopOptions || [])];
                                if (checked && !newStops.includes(opt)) {
                                  newStops.push(opt);
                                } else if (!checked) {
                                  newStops = newStops.filter(o => o !== opt);
                                }
                                updateField(activeField.id, { exclusiveStopOptions: newStops });
                              }}
                            />
                            <span className="text-sm font-medium">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeField.type === 'rating' && (
            <div className="border-t border-gray-100 pt-6">
              <label className="text-sm font-bold text-gray-700 block mb-2">Max Stars</label>
              <input type="number" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={activeField.ratingMax || 5} onChange={(e) => updateField(activeField.id, { ratingMax: parseInt(e.target.value) })} />
            </div>
          )}

          {activeField.type === 'scale' && (
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-bold text-gray-700 block mb-2">Min Value</label>
                  <input type="number" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={activeField.scale?.min || 1} onChange={(e) => updateField(activeField.id, { scale: { ...activeField.scale, min: parseInt(e.target.value) } })} />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-bold text-gray-700 block mb-2">Max Value</label>
                  <input type="number" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={activeField.scale?.max || 10} onChange={(e) => updateField(activeField.id, { scale: { ...activeField.scale, max: parseInt(e.target.value) } })} />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-bold text-gray-700 block mb-2">Min Label</label>
                  <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={activeField.scale?.minLabel || ''} onChange={(e) => updateField(activeField.id, { scale: { ...activeField.scale, minLabel: e.target.value } })} />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-bold text-gray-700 block mb-2">Max Label</label>
                  <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={activeField.scale?.maxLabel || ''} onChange={(e) => updateField(activeField.id, { scale: { ...activeField.scale, maxLabel: e.target.value } })} />
                </div>
              </div>
            </div>
          )}

          {activeField.type === 'qr_scanner' && (
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                QR Data Mapping (JSON)
              </h3>
              <p className="text-xs text-gray-500 mb-2">Map keys from the scanned JSON to form fields.</p>

              <div className="space-y-2 mb-3">
                {(activeField.qrMappings || []).map((mapping, i) => (
                  <div key={i} className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                    <input
                      className="flex-1 border border-gray-300 p-2 rounded text-sm bg-white"
                      placeholder="JSON Key (e.g. name)"
                      value={mapping.qrKey || ''}
                      onChange={(e) => {
                        const newMappings = [...(activeField.qrMappings || [])];
                        newMappings[i] = { ...newMappings[i], qrKey: e.target.value };
                        updateField(activeField.id, { qrMappings: newMappings });
                      }}
                    />
                    <span className="text-gray-400">→</span>
                    <select
                      className="flex-1 border border-gray-300 p-2 rounded text-sm bg-white"
                      value={mapping.fieldId || ''}
                      onChange={(e) => {
                        const newMappings = [...(activeField.qrMappings || [])];
                        newMappings[i] = { ...newMappings[i], fieldId: e.target.value };
                        updateField(activeField.id, { qrMappings: newMappings });
                      }}
                    >
                      <option value="">Select Field...</option>
                      {schemaData.filter(f => f.id !== activeField.id && !['page_break', 'section_header', 'instruction', 'divider'].includes(f.type)).map(f => (
                        <option key={f.id} value={f.id}>{f.label || f.id}</option>
                      ))}
                    </select>
                    <button
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded"
                      onClick={() => {
                        const newMappings = (activeField.qrMappings || []).filter((_, idx) => idx !== i);
                        updateField(activeField.id, { qrMappings: newMappings });
                      }}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                onClick={() => updateField(activeField.id, { qrMappings: [...(activeField.qrMappings || []), { qrKey: '', fieldId: '' }] })}
              >
                + Add Mapping
              </button>
            </div>
          )}

          {activeField.type === 'bmi' && (
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">BMI Settings</h3>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">Measurement Unit</label>
                <select
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={activeField.bmiUnit || 'metric'}
                  onChange={(e) => updateField(activeField.id, { bmiUnit: e.target.value })}
                >
                  <option value="metric">Metric (kg, cm)</option>
                  <option value="imperial">Imperial (lbs, in)</option>
                </select>
              </div>
            </div>
          )}

          {activeField.type === 'calculated_score' && (
            <div className="border-t border-gray-100 pt-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700">Calculation Method</h3>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${!activeField.calculationMethod || activeField.calculationMethod === 'sum' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => updateField(activeField.id, { calculationMethod: 'sum' })}
                    >
                      Sum of Fields
                    </button>
                    <button
                      className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${activeField.calculationMethod === 'formula' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => updateField(activeField.id, { calculationMethod: 'formula' })}
                    >
                      Custom Formula
                    </button>
                  </div>
                </div>

                {(!activeField.calculationMethod || activeField.calculationMethod === 'sum') ? (
                  <>
                    <p className="text-xs text-gray-500 mb-3">Select the scored fields you want to calculate.</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                      {schemaData.filter(f => f.id !== activeField.id && ['dropdown', 'radio', 'multi_select', 'checkbox', 'searchable_dropdown', 'searchable_multi_select'].includes(f.type) && f.enableScoring).length === 0 && (
                        <div className="text-xs text-gray-400 p-2 text-center">No fields have "Enable Scoring" turned on.</div>
                      )}
                      {schemaData.filter(f => f.id !== activeField.id && ['dropdown', 'radio', 'multi_select', 'checkbox', 'searchable_dropdown', 'searchable_multi_select'].includes(f.type) && f.enableScoring).map(f => (
                        <label key={f.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded border border-gray-100 cursor-pointer hover:border-blue-300">
                          <input
                            type="checkbox"
                            className="rounded text-blue-600 focus:ring-blue-500"
                            checked={(activeField.calculatedFields || []).includes(f.id)}
                            onChange={(e) => {
                              let newFields = [...(activeField.calculatedFields || [])];
                              if (e.target.checked) newFields.push(f.id);
                              else newFields = newFields.filter(id => id !== f.id);
                              updateField(activeField.id, { calculatedFields: newFields });
                            }}
                          />
                          <span className="font-medium text-gray-700 truncate">{f.label || f.id}</span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-2">Write mathematical formulas using field IDs wrapped in brackets. Example: <code className="bg-white px-1 py-0.5 rounded border">([smoking_per_day] * 365) / [age]</code></p>
                    <textarea
                      className="w-full border border-gray-300 p-3 rounded-lg text-sm font-mono bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      rows="3"
                      placeholder="e.g. [smoking_per_day] * [smoking_duration]"
                      value={activeField.formula || ''}
                      onChange={(e) => updateField(activeField.id, { formula: e.target.value })}
                    />
                    <div className="mt-3">
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Available Variables</p>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {schemaData.filter(f => f.id !== activeField.id && !['page_break', 'section_header', 'instruction', 'divider', 'file', 'image', 'signature', 'gps'].includes(f.type)).map(f => {
                          const varName = f.variableName || slugify(f.label) || f.id;
                          return (
                            <button
                              key={f.id}
                              title={f.label || f.id}
                              className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded hover:bg-blue-50 hover:border-blue-300 transition text-gray-600 truncate max-w-[150px]"
                              onClick={() => updateField(activeField.id, { formula: (activeField.formula || '') + `[${varName}]` })}
                            >
                              [{varName}]
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-2">Score Thresholds (Badges)</h3>
                <div className="space-y-3 mb-3">
                  {(activeField.scoreThresholds || []).map((t, i) => (
                    <div key={i} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-gray-500">Min:</span>
                        <input type="number" className="w-16 p-1 text-sm border border-gray-300 rounded" value={t.min} onChange={e => {
                          const newT = activeField.scoreThresholds.map((item, idx) =>
                            idx === i ? { ...item, min: Number(e.target.value) } : item
                          );
                          updateField(activeField.id, { scoreThresholds: newT });
                        }} />
                        <span className="text-xs text-gray-500">Max:</span>
                        <input type="number" className="w-16 p-1 text-sm border border-gray-300 rounded" value={t.max} onChange={e => {
                          const newT = activeField.scoreThresholds.map((item, idx) =>
                            idx === i ? { ...item, max: Number(e.target.value) } : item
                          );
                          updateField(activeField.id, { scoreThresholds: newT });
                        }} />
                        <button className="ml-auto text-red-500 text-xs hover:underline" onClick={() => {
                          const newT = activeField.scoreThresholds.filter((_, idx) => idx !== i);
                          updateField(activeField.id, { scoreThresholds: newT });
                        }}>Remove</button>
                      </div>
                      <div className="flex gap-2">
                        <input type="text" className="flex-1 p-2 text-sm border border-gray-300 rounded" placeholder="Badge Label" value={t.label} onChange={e => {
                          const newT = activeField.scoreThresholds.map((item, idx) =>
                            idx === i ? { ...item, label: e.target.value } : item
                          );
                          updateField(activeField.id, { scoreThresholds: newT });
                        }} />
                        <select className="w-24 p-2 text-sm border border-gray-300 rounded" value={t.color} onChange={e => {
                          const newT = activeField.scoreThresholds.map((item, idx) =>
                            idx === i ? { ...item, color: e.target.value } : item
                          );
                          updateField(activeField.id, { scoreThresholds: newT });
                        }}>
                          <option value="green">Green</option>
                          <option value="yellow">Yellow</option>
                          <option value="red">Red</option>
                          <option value="blue">Blue</option>
                          <option value="gray">Gray</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                  onClick={() => updateField(activeField.id, { scoreThresholds: [...(activeField.scoreThresholds || []), { min: 0, max: 10, label: 'New Badge', color: 'gray' }] })}
                >
                  + Add Threshold
                </button>
              </div>
            </div>
          )}

          {activeField.type === 'cohort_input' && (
            <div className="border-t border-gray-100 pt-6 space-y-5">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Cohort Validation Rules</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Target Age Field</label>
                  <select
                    className="w-full border border-gray-300 p-2 rounded bg-white text-sm"
                    value={activeField.ageFieldId || ''}
                    onChange={(e) => updateField(activeField.id, { ageFieldId: e.target.value })}
                  >
                    <option value="">Select Age Field...</option>
                    {schemaData.filter(f => f.id !== activeField.id && (f.type === 'dob_age' || f.type === 'number')).map(f => (
                      <option key={f.id} value={f.id}>{f.label || f.id}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Target Gender Field</label>
                  <select
                    className="w-full border border-gray-300 p-2 rounded bg-white text-sm"
                    value={activeField.genderFieldId || ''}
                    onChange={(e) => updateField(activeField.id, { genderFieldId: e.target.value })}
                  >
                    <option value="">Select Gender Field...</option>
                    {schemaData.filter(f => f.id !== activeField.id && ['gender', 'dropdown', 'radio'].includes(f.type)).map(f => (
                      <option key={f.id} value={f.id}>{f.label || f.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Mapping Matrix</label>
                <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                  {(activeField.cohortRules || []).map((rule, i) => (
                    <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded text-sm flex flex-col gap-2">
                      <div className="flex gap-2 items-center">
                        <span className="text-gray-500 w-8">Age:</span>
                        <input type="number" placeholder="Min" className="w-16 p-1.5 border rounded" value={rule.minAge ?? ''} onChange={e => {
                          const newRules = [...activeField.cohortRules];
                          newRules[i].minAge = e.target.value === '' ? '' : Number(e.target.value);
                          updateField(activeField.id, { cohortRules: newRules });
                        }} />
                        <span className="text-gray-400">-</span>
                        <input type="number" placeholder="Max" className="w-16 p-1.5 border rounded" value={rule.maxAge ?? ''} onChange={e => {
                          const newRules = [...activeField.cohortRules];
                          newRules[i].maxAge = e.target.value === '' ? '' : Number(e.target.value);
                          updateField(activeField.id, { cohortRules: newRules });
                        }} />
                        <button className="ml-auto text-red-500 hover:text-red-700" onClick={() => {
                          const newRules = activeField.cohortRules.filter((_, idx) => idx !== i);
                          updateField(activeField.id, { cohortRules: newRules });
                        }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-gray-500 w-8">Sex:</span>
                        <input type="text" placeholder="Value (e.g. Male)" className="flex-1 p-1.5 border rounded" value={rule.genderValue || ''} onChange={e => {
                          const newRules = [...activeField.cohortRules];
                          newRules[i].genderValue = e.target.value;
                          updateField(activeField.id, { cohortRules: newRules });
                        }} />
                      </div>
                      <div className="flex gap-2 items-center mt-1 pt-2 border-t border-gray-200">
                        <span className="font-medium text-blue-700 w-16">Prefix:</span>
                        <input type="text" placeholder="Expected (e.g. 1A)" className="flex-1 p-1.5 border border-blue-300 bg-blue-50 rounded" value={rule.prefix || ''} onChange={e => {
                          const newRules = [...activeField.cohortRules];
                          newRules[i].prefix = e.target.value;
                          updateField(activeField.id, { cohortRules: newRules });
                        }} />
                      </div>
                    </div>
                  ))}
                  {(activeField.cohortRules || []).length === 0 && (
                    <div className="text-xs text-gray-400 italic text-center p-2">No rules added yet.</div>
                  )}
                </div>
                <button
                  className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                  onClick={() => updateField(activeField.id, {
                    cohortRules: [...(activeField.cohortRules || []), { minAge: '', maxAge: '', genderValue: '', prefix: '' }]
                  })}
                >
                  + Add Rule
                </button>
              </div>
            </div>
          )}

          {/* LOGIC SECTION */}
          {(() => {
            const logic = activeField.logic || { action: 'show', joinType: 'AND', rules: [] };
            
            // Normalize logic format to support backward compatibility
            let normalizedLogic = {
              action: logic.action || 'show',
              joinType: logic.joinType || 'AND',
              rules: logic.rules || []
            };
            
            if (logic.fieldId) {
              normalizedLogic.rules = [{
                fieldId: logic.fieldId,
                operator: logic.operator || '==',
                value: logic.value || ''
              }];
            }

            return (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Conditional Logic
                </h3>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-purple-750 block mb-1.5 uppercase tracking-wider">Logic Action</label>
                    <select
                      className="w-full p-2 border border-purple-200 rounded text-sm bg-white font-semibold text-purple-750"
                      value={normalizedLogic.action}
                      onChange={(e) => {
                        const updated = { ...normalizedLogic, action: e.target.value };
                        updateField(activeField.id, { logic: updated });
                      }}
                    >
                      <option value="show">Show this field</option>
                      <option value="hide">Hide this field</option>
                      <option value="require">Require this field</option>
                    </select>
                  </div>

                  {normalizedLogic.rules.length > 1 && (
                    <div className="flex items-center justify-between text-xs font-bold text-purple-800 bg-purple-100/50 p-2.5 rounded border border-purple-200/50">
                      <span>Match Conditions:</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...normalizedLogic, joinType: 'AND' };
                            updateField(activeField.id, { logic: updated });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer ${normalizedLogic.joinType === 'AND' ? 'bg-purple-650 text-white shadow-sm' : 'bg-transparent text-purple-700 hover:bg-purple-200/60'}`}
                        >
                          ALL (AND)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...normalizedLogic, joinType: 'OR' };
                            updateField(activeField.id, { logic: updated });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer ${normalizedLogic.joinType === 'OR' ? 'bg-purple-650 text-white shadow-sm' : 'bg-transparent text-purple-700 hover:bg-purple-200/60'}`}
                        >
                          ANY (OR)
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {normalizedLogic.rules.map((rule, idx) => {
                      const sourceField = schemaData.find(f => f.id === rule.fieldId);
                      const hasOptions = sourceField && ['dropdown', 'radio', 'multi_select', 'gender', 'searchable_dropdown', 'searchable_multi_select'].includes(sourceField.type);
                      const opts = sourceField ? (sourceField.type === 'gender' ? ['Male', 'Female', 'Other', 'Prefer not to say'] : (sourceField.options || [])) : [];

                      return (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-purple-200/60 shadow-sm space-y-2 relative">
                          <div className="flex justify-between items-center text-[10px] font-extrabold text-purple-500 uppercase tracking-wider">
                            <span>Condition #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newRules = normalizedLogic.rules.filter((_, i) => i !== idx);
                                const updated = { ...normalizedLogic, rules: newRules };
                                updateField(activeField.id, { logic: updated });
                              }}
                              className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>

                          {/* Select Field */}
                          <select 
                            className="w-full p-2 border border-gray-250 rounded text-xs bg-white"
                            value={rule.fieldId || ''}
                            onChange={(e) => {
                              const newRules = [...normalizedLogic.rules];
                              newRules[idx] = { ...newRules[idx], fieldId: e.target.value, value: '' };
                              const updated = { ...normalizedLogic, rules: newRules };
                              updateField(activeField.id, { logic: updated });
                            }}
                          >
                            <option value="">Select Target Field...</option>
                            {schemaData.filter(f => f.id !== activeField.id && f.type !== 'page_break').map(f => (
                              <option key={f.id} value={f.id}>{f.label || f.id} ({f.type})</option>
                            ))}
                          </select>

                          {rule.fieldId && (
                            <>
                              {/* Operator */}
                              <select 
                                className="w-full p-2 border border-gray-250 rounded text-xs bg-white"
                                value={rule.operator || '=='}
                                onChange={(e) => {
                                  const newRules = [...normalizedLogic.rules];
                                  newRules[idx] = { ...newRules[idx], operator: e.target.value };
                                  const updated = { ...normalizedLogic, rules: newRules };
                                  updateField(activeField.id, { logic: updated });
                                }}
                              >
                                <option value="==">Equals</option>
                                <option value="!=">Not Equals</option>
                                <option value="contains">Contains</option>
                                <option value="<">Less Than</option>
                                <option value=">">Greater Than</option>
                              </select>

                              {/* Value Input */}
                              {hasOptions ? (
                                <select
                                  className="w-full p-2 border border-gray-250 rounded text-xs bg-white"
                                  value={rule.value || ''}
                                  onChange={(e) => {
                                    const newRules = [...normalizedLogic.rules];
                                    newRules[idx] = { ...newRules[idx], value: e.target.value };
                                    const updated = { ...normalizedLogic, rules: newRules };
                                    updateField(activeField.id, { logic: updated });
                                  }}
                                >
                                  <option value="">Select Value...</option>
                                  {opts.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <input 
                                  className="w-full p-2 border border-gray-250 rounded text-xs bg-white font-medium"
                                  placeholder="Type value..."
                                  value={rule.value || ''}
                                  onChange={(e) => {
                                    const newRules = [...normalizedLogic.rules];
                                    newRules[idx] = { ...newRules[idx], value: e.target.value };
                                    const updated = { ...normalizedLogic, rules: newRules };
                                    updateField(activeField.id, { logic: updated });
                                  }}
                                />
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newRules = [...normalizedLogic.rules, { fieldId: '', operator: '==', value: '' }];
                      const updated = { ...normalizedLogic, rules: newRules };
                      updateField(activeField.id, { logic: updated });
                    }}
                    className="w-full py-2.5 bg-white text-purple-700 hover:bg-purple-100/50 font-bold border border-purple-200 border-dashed rounded-lg transition text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    + Add Condition
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="border-t border-gray-100 pt-6 mt-8">
            <button
              onClick={() => {
                setSchemaData(schemaData.filter(f => f.id !== activeField.id));
                setActiveFieldId(null);
              }}
              className="w-full border border-red-200 text-red-600 p-3 rounded-lg hover:bg-red-50 font-medium transition"
            >
              Delete Field
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
