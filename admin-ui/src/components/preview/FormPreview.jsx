import React, { useMemo, useState } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import SignatureCanvas from 'react-signature-canvas';
import { QRScannerComponent } from './QRScannerComponent';
import { DOBAgeComponent } from './DOBAgeComponent';
import { BMIComponent } from './BMIComponent';
import { GPSComponent } from './GPSComponent';
import { CalculatedScoreComponent } from './CalculatedScoreComponent';
import { validateCohortRules } from './validateCohortRules';
import { CohortInputComponent } from './CohortInputComponent';
import Select from 'react-select';

const reactSelectAdminStyles = {
  control: (base, state) => ({
    ...base,
    border: state.isFocused ? '2px solid #3b82f6' : '1px solid #d1d5db',
    boxShadow: 'none',
    '&:hover': { border: state.isFocused ? '2px solid #3b82f6' : '1px solid #d1d5db' },
    borderRadius: '0.5rem',
    padding: '2px',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    cursor: 'pointer',
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#dbeafe',
    borderRadius: '0.25rem',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#1e40af',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#1e40af',
    ':hover': {
      backgroundColor: '#bfdbfe',
      color: '#1e3a8a',
    },
  }),
};

export function FormPreview({ schemaData, title }) {
  const { register, control, trigger, setValue, getValues, formState: { errors } } = useForm();
  const formValues = useWatch({ control });
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { pages, isTerminated } = useMemo(() => {
    if (!schemaData) return { pages: [], isTerminated: false };
    const p = [];
    let currentPage = { title: title, description: '', fields: [], logic: null };
    let terminated = false;
    
    for (const field of schemaData) {
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

    const filteredPages = p.filter((page, index) => {
      if (index === 0) return true;
      if (page.logic && page.logic.fieldId) {
        const depVal = formValues[page.logic.fieldId];
        const targetVal = page.logic.value;
        const op = page.logic.operator || '==';
        const action = page.logic.action || 'show';
        
        let conditionMet = false;
        // Handle undefined/null depVal gracefully
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
  }, [schemaData, title, formValues]);

  const currentFields = pages[currentPageIndex]?.fields || [];
  const totalPages = pages.length;

  const handleNext = async (e) => {
    e.preventDefault();
    const isPageValid = await trigger(currentFields.map(f => f.id));
    if (isPageValid) setCurrentPageIndex(c => Math.min(totalPages - 1, c + 1));
  };

  const handlePrev = (e) => {
    e.preventDefault();
    setCurrentPageIndex(c => Math.max(0, c - 1));
  };

  return (
     <div className="bg-white p-8 shadow-sm border border-gray-200 rounded-xl min-h-[600px] max-w-3xl mx-auto mt-6">
       <div className="bg-yellow-500 text-yellow-900 px-6 py-2.5 text-center text-sm font-bold uppercase tracking-widest shadow-inner mb-0 -mx-8 -mt-8 rounded-t-xl flex justify-center items-center gap-2">
         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
         Preview Mode - Data will not be saved
       </div>
       <div className="bg-blue-600 text-white p-6 -mx-8 mb-8">
         <h2 className="text-2xl font-bold">{pages[currentPageIndex]?.title || title}</h2>
         {pages[currentPageIndex]?.description && <p className="mt-2 opacity-90">{pages[currentPageIndex].description}</p>}
         {totalPages > 1 && (
           <div className="mt-6 flex flex-col gap-2">
             <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-blue-100">
               <span>Step {currentPageIndex + 1} of {totalPages}</span>
             </div>
             <div className="flex gap-2">
               {pages.map((_, i) => (
                 <div key={i} className={`h-2 flex-1 rounded-full ${i <= currentPageIndex ? 'bg-white' : 'bg-blue-800 bg-opacity-40'}`}></div>
               ))}
             </div>
           </div>
         )}
       </div>
       <form className="space-y-6">
          {currentFields.map(field => {
             let isRequired = field.required;

              if (field.logic && field.logic.fieldId) {
                 const depVal = formValues[field.logic.fieldId];
                 const targetVal = field.logic.value;
                 const op = field.logic.operator || '==';
                 const action = field.logic.action || 'show';
                 
                 let conditionMet = false;
                 // Handle undefined/null depVal gracefully
                 const val = depVal === undefined || depVal === null ? '' : depVal;
                 
                 if (op === '==') conditionMet = (String(val) === String(targetVal));
                 if (op === '!=') conditionMet = (String(val) !== String(targetVal));
                 if (op === '<') conditionMet = (Number(val) < Number(targetVal));
                 if (op === '>') conditionMet = (Number(val) > Number(targetVal));
                 if (op === 'contains') conditionMet = (val && String(val).toLowerCase().includes(String(targetVal).toLowerCase()));
                 
                 if (conditionMet) {
                    if (action === 'hide') return null;
                    if (action === 'require') isRequired = true;
                 } else {
                    if (action === 'show') return null;
                 }
              }

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
             const linkedCohortField = schemaData.find(f => 
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
               <div key={field.id} className={`flex flex-col ${isLayout ? '' : 'bg-gray-50 p-4 rounded-lg border border-gray-100'}`}>
                 {!isLayout && (
                   <>
                     <label className="font-semibold text-gray-700 mb-1 flex items-center">
                       {field.label}
                       {isRequired && <span className="text-red-500 ml-1">*</span>}
                     </label>
                     {field.helpText && <p className="text-xs text-gray-500 mb-3">{field.helpText}</p>}
                     {!field.helpText && <div className="mb-2"></div>}
                   </>
                 )}
                 
                 {field.type === 'text' && <input type="text" className="border border-gray-300 p-3 rounded-lg bg-white w-full" placeholder={field.placeholder || "Text input"} {...register(field.id, validationRules)} />}
                 {field.type === 'textarea' && <textarea className="border border-gray-300 p-3 rounded-lg bg-white w-full" rows="3" placeholder={field.placeholder || "Long text"} {...register(field.id, validationRules)} />}
                 {field.type === 'number' && <input type="number" className="border border-gray-300 p-3 rounded-lg bg-white w-full" placeholder={field.placeholder || "0"} {...register(field.id, validationRules)} />}
                 {field.type === 'email' && <input type="email" className="border border-gray-300 p-3 rounded-lg bg-white w-full" placeholder={field.placeholder || "email@example.com"} {...register(field.id, validationRules)} />}
                 {field.type === 'phone' && <input type="tel" className="border border-gray-300 p-3 rounded-lg bg-white w-full" placeholder={field.placeholder || "+1 234 567 8900"} {...register(field.id, validationRules)} />}
                 {field.type === 'date' && <input type="date" className="border border-gray-300 p-3 rounded-lg bg-white w-full" {...register(field.id, validationRules)} />}
                 {field.type === 'time' && <input type="time" className="border border-gray-300 p-3 rounded-lg bg-white w-full" {...register(field.id, validationRules)} />}
                 {field.type === 'checkbox' && (
                   <label className="flex items-center gap-3">
                     <input type="checkbox" className="w-5 h-5 text-blue-600" {...register(field.id, validationRules)} />
                     <span className="text-gray-600">Check to confirm</span>
                   </label>
                 )}
                 {field.type === 'dropdown' && (
                   <select className="border border-gray-300 p-3 rounded-lg bg-white w-full" {...register(field.id, validationRules)}>
                     <option value="">{field.placeholder || "Select..."}</option>
                     {(field.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
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
                         styles={reactSelectAdminStyles}
                       />
                     )}
                   />
                 )}
                 {field.type === 'radio' && (
                   <div className="space-y-3">
                     {(field.options || []).map((opt, i) => (
                       <label key={i} className="flex items-center gap-3 bg-white p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                         <input type="radio" value={opt} className="w-4 h-4 text-blue-600" {...register(field.id, validationRules)} />
                         {opt}
                       </label>
                     ))}
                   </div>
                 )}
                 {field.type === 'gender' && (
                   <div className="space-y-3">
                     {(field.options || ['Male', 'Female', 'Other', 'Prefer not to say']).map((opt, i) => (
                       <label key={i} className="flex items-center gap-3 bg-white p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                         <input type="radio" value={opt} className="w-4 h-4 text-blue-600" {...register(field.id, validationRules)} />
                         {opt}
                       </label>
                     ))}
                   </div>
                 )}
                 {field.type === 'multi_select' && (
                   <div className="space-y-3">
                     {(field.options || []).map((opt, i) => (
                       <label key={i} className="flex items-center gap-3 bg-white p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                         <input type="checkbox" value={opt} className="w-4 h-4 text-blue-600" {...register(field.id, validationRules)} />
                         {opt}
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
                         styles={reactSelectAdminStyles}
                       />
                     )}
                   />
                 )}
                 {field.type === 'file' && <input type="file" className="border border-gray-300 p-2.5 rounded-lg bg-white w-full text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition" {...register(field.id, validationRules)} />}
                 {field.type === 'image' && <input type="file" accept="image/*" className="border border-gray-300 p-2.5 rounded-lg bg-white w-full text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition" {...register(field.id, validationRules)} />}
                 
                 {field.type === 'rating' && (
                   <Controller name={field.id} control={control} rules={validationRules} render={({ field: { onChange, value } }) => (
                     <div className="flex gap-2">
                       {[...Array(field.ratingMax || 5)].map((_, i) => (
                         <button key={i} type="button" onClick={() => onChange(i + 1)} className={`text-4xl focus:outline-none transition ${value > i ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}>★</button>
                       ))}
                     </div>
                   )} />
                 )}
                 
                 {field.type === 'scale' && (
                   <Controller name={field.id} control={control} rules={validationRules} render={({ field: { onChange, value } }) => {
                     const min = field.scale?.min || 1;
                     const max = field.scale?.max || 10;
                     const options = Array.from({length: max - min + 1}, (_, i) => min + i);
                     return (
                       <div>
                         <div className="flex justify-between text-xs text-gray-500 mb-3 font-bold uppercase tracking-wider">
                           <span>{field.scale?.minLabel || 'Poor'}</span>
                           <span>{field.scale?.maxLabel || 'Excellent'}</span>
                         </div>
                         <div className="flex justify-between items-center gap-1 bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                           {options.map(opt => (
                             <label key={opt} className="flex flex-col items-center gap-2 cursor-pointer flex-1 group">
                               <input type="radio" name={field.id} value={opt} onChange={() => onChange(opt)} checked={value === opt} className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
                               <span className={`text-sm font-semibold transition ${value === opt ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-500'}`}>{opt}</span>
                             </label>
                           ))}
                         </div>
                       </div>
                     )
                   }} />
                 )}
                 
                 {field.type === 'signature' && (
                   <Controller name={field.id} control={control} rules={validationRules} render={({ field: { onChange } }) => (
                     <div className="border border-gray-300 rounded-lg bg-white overflow-hidden shadow-inner">
                       <SignatureCanvas penColor="black" canvasProps={{ className: 'w-full h-40 bg-gray-50 cursor-crosshair' }} onEnd={function() { onChange(this.toDataURL()); }} />
                       <div className="bg-gray-100 px-4 py-2.5 text-xs text-gray-500 border-t border-gray-200 font-medium uppercase tracking-wider text-right">Sign inside the box</div>
                     </div>
                   )} />
                 )}
                 
                 {field.type === 'qr_scanner' && (
                   <Controller name={field.id} control={control} rules={validationRules} render={({ field: { onChange } }) => (
                     <QRScannerComponent field={field} onChange={onChange} setValue={setValue} />
                   )} />
                 )}

                 {field.type === 'dob_age' && (
                   <Controller name={field.id} control={control} rules={validationRules} render={({ field: { onChange, value } }) => (
                     <DOBAgeComponent field={field} value={value} onChange={onChange} />
                   )} />
                 )}

                 {field.type === 'bmi' && (
                   <Controller name={field.id} control={control} rules={validationRules} render={({ field: { onChange, value } }) => (
                     <BMIComponent field={field} value={value} onChange={onChange} />
                   )} />
                 )}

                 {field.type === 'gps' && (
                   <Controller name={field.id} control={control} rules={validationRules} render={({ field: { onChange, value } }) => (
                     <GPSComponent field={field} value={value} onChange={onChange} />
                   )} />
                 )}

                 {field.type === 'calculated_score' && (
                   <Controller name={field.id} control={control} rules={validationRules} render={({ field: { onChange } }) => (
                     <CalculatedScoreComponent field={field} control={control} schemaData={schemaData} onChange={onChange} />
                   )} />
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
                 
                 {errors[field.id] && <span className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {errors[field.id].message}</span>}
               </div>
             );
          })}
           <div className="pt-6 border-t border-gray-100 mt-8 flex justify-between gap-4">
             {currentPageIndex > 0 ? (
               <button onClick={handlePrev} className="flex-1 bg-gray-100 text-gray-700 px-6 py-3.5 rounded-xl font-bold text-lg hover:bg-gray-200 transition">Previous</button>
             ) : <div className="flex-1"></div>}
             <button onClick={currentPageIndex < totalPages - 1 ? handleNext : (e) => e.preventDefault()} className="flex-1 bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg">
               {currentPageIndex < totalPages - 1 ? 'Next' : 'Submit (Preview)'}
             </button>
           </div>
       </form>
     </div>
  )
}
