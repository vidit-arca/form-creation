import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableField } from './SortableField';

export function Canvas({ schemaData, activeFieldId, setActiveFieldId, duplicateField, handleDragEnd, sensors }) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl min-h-[600px] max-w-3xl mx-auto pb-20">
        {schemaData.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-xl font-bold text-gray-500 mb-1">Canvas is empty</p>
            <p className="text-sm">Click items in the toolbox to build your form.</p>
            <p className="text-xs text-gray-400 mt-6 bg-gray-50 p-2 rounded border border-gray-200">💡 Press <kbd className="font-mono bg-white px-1 shadow-sm border border-gray-200 rounded">Ctrl+Z</kbd> to undo and <kbd className="font-mono bg-white px-1 shadow-sm border border-gray-200 rounded">/</kbd> to search fields.</p>
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={schemaData.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {schemaData.map((field) => (
              <SortableField 
                key={field.id} 
                field={field} 
                isActive={activeFieldId === field.id}
                onClick={() => setActiveFieldId(field.id)}
                onDuplicate={duplicateField}
              >
                <div className="flex justify-between items-start mb-2 pl-4">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {field.type === 'page_break' ? '--- Page Break ---' : field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  <div className="flex items-center gap-2 mr-10">
                    {field.enableExclusiveStop && field.exclusiveStopOptions?.length > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 font-bold flex items-center gap-1 shadow-sm">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        STOP TRIGGER
                      </span>
                    )}
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded uppercase tracking-wide font-mono">{field.type}</span>
                  </div>
                </div>
                
                {field.type !== 'page_break' && (
                  <div className="opacity-50 pointer-events-none mt-4 pl-4">
                    {field.type === 'text' && <input className="border border-gray-300 rounded p-2 w-full bg-white" placeholder="Text input" disabled />}
                    {field.type === 'textarea' && <textarea className="border border-gray-300 rounded p-2 w-full bg-white" rows="2" placeholder="Textarea" disabled />}
                    {field.type === 'number' && <input type="number" className="border border-gray-300 rounded p-2 w-full bg-white" placeholder="0" disabled />}
                    {field.type === 'email' && <input type="email" className="border border-gray-300 rounded p-2 w-full bg-white" placeholder="email@example.com" disabled />}
                    {field.type === 'phone' && <input type="tel" className="border border-gray-300 rounded p-2 w-full bg-white" placeholder="+1 234 567 8900" disabled />}
                    {field.type === 'date' && <input type="date" className="border border-gray-300 rounded p-2 w-full bg-white" disabled />}
                    {field.type === 'time' && <input type="time" className="border border-gray-300 rounded p-2 w-full bg-white" disabled />}
                    {field.type === 'checkbox' && <div className="flex items-center gap-2"><input type="checkbox" className="w-5 h-5" disabled /> <span>Check to confirm</span></div>}
                    {field.type === 'dropdown' && <select className="border border-gray-300 rounded p-2 w-full bg-white" disabled><option>Select...</option></select>}
                    {field.type === 'radio' && (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2"><input type="radio" disabled/> Opt 1</label>
                          <label className="flex items-center gap-2"><input type="radio" disabled/> Opt 2</label>
                        </div>
                    )}
                    {field.type === 'gender' && (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2"><input type="radio" disabled/> Male</label>
                          <label className="flex items-center gap-2"><input type="radio" disabled/> Female</label>
                          <label className="flex items-center gap-2"><input type="radio" disabled/> Other</label>
                        </div>
                    )}
                    {field.type === 'multi_select' && (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2"><input type="checkbox" disabled/> Opt 1</label>
                          <label className="flex items-center gap-2"><input type="checkbox" disabled/> Opt 2</label>
                        </div>
                    )}
                    {field.type === 'searchable_dropdown' && (
                      <div className="border border-gray-300 p-2.5 rounded bg-gray-50 flex justify-between items-center text-gray-400 text-sm">
                        <span>Searchable selection...</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    )}
                    {field.type === 'searchable_multi_select' && (
                      <div className="border border-gray-300 p-2.5 rounded bg-gray-50 flex justify-between items-center text-gray-400 text-sm">
                        <span>Search & select multiple...</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                    )}
                    {field.type === 'rating' && <div className="text-2xl text-gray-300">{'★'.repeat(field.ratingMax || 5)}</div>}
                    {field.type === 'scale' && <div className="flex justify-between text-sm text-gray-400 border-t border-gray-200 pt-2 mt-2"><span>{field.scale?.min || 1}</span><span className="flex-1 border-b border-dashed border-gray-300 mx-4 mb-2"></span><span>{field.scale?.max || 10}</span></div>}
                    {field.type === 'file' && <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center bg-gray-50 text-gray-500">Upload File</div>}
                    {field.type === 'image' && <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center bg-gray-50 text-gray-500">Upload Image</div>}
                    {field.type === 'signature' && <div className="border border-gray-300 rounded h-20 bg-gray-50 flex items-center justify-center text-gray-400">Signature Area</div>}
                    {field.type === 'section_header' && <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Section Header</h2>}
                    {field.type === 'instruction' && <p className="text-gray-600 bg-blue-50 p-3 rounded border border-blue-100">Instruction text block...</p>}
                    {field.type === 'divider' && <hr className="border-gray-300 my-4" />}
                    {field.type === 'qr_scanner' && (
                      <div className="border border-gray-300 rounded p-4 bg-gray-50 flex items-center justify-center gap-2 text-gray-500">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        QR Scanner Placeholder
                      </div>
                    )}
                    {field.type === 'gps' && (
                      <div className="border border-gray-300 rounded p-4 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-500">
                        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="font-medium text-sm text-gray-600">Interactive Map Placeholder</span>
                      </div>
                    )}
                    {field.type === 'calculated_score' && (
                      <div className="border border-gray-200 bg-blue-50 rounded p-4 flex justify-between items-center">
                        <div className="text-gray-600 text-sm font-medium">Calculated Score:</div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-gray-800">--</span>
                          <span className="px-3 py-1 rounded-full text-xs font-bold border bg-gray-100 text-gray-500 border-gray-200 uppercase tracking-wider">
                            Badge
                          </span>
                        </div>
                      </div>
                    )}
                    {field.type === 'cohort_input' && (
                      <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-50" placeholder={field.placeholder || "Enter Cohort ID (e.g., 1A-201)"} disabled />
                    )}
                    {field.type === 'dob_age' && (
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Date of Birth</label>
                          <input type="date" className="border border-gray-300 rounded p-2 w-full bg-white" disabled />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Calculated Age</label>
                          <input type="text" className="border border-gray-200 rounded p-2 w-full bg-gray-50 text-gray-400" placeholder="Auto-calculated" disabled />
                        </div>
                      </div>
                    )}
                    {field.type === 'bmi' && (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="text-xs text-gray-500 block mb-1">Height ({field.bmiUnit === 'imperial' ? 'in' : 'cm'})</label>
                            <input type="number" className="border border-gray-300 rounded p-2 w-full bg-white" disabled />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-500 block mb-1">Weight ({field.bmiUnit === 'imperial' ? 'lbs' : 'kg'})</label>
                            <input type="number" className="border border-gray-300 rounded p-2 w-full bg-white" disabled />
                          </div>
                        </div>
                        <div className="border border-gray-200 bg-gray-50 rounded p-3 text-center text-gray-500 font-medium">
                          BMI: -- (Auto-calculated)
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {field.logic && field.logic.fieldId && (
                    <div className="mt-4 pl-4 text-xs bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-200 inline-block">
                      Logic applied: {(field.logic.action || 'show').toUpperCase()} if [{field.logic.fieldId}] {field.logic.operator || '=='} "{field.logic.value}"
                    </div>
                )}
              </SortableField>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
