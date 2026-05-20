import React, { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

export function CohortInputComponent({ field, control, trigger, register, validationRules, errors }) {
  // Watch the cohort input value
  const cohortValue = useWatch({ control, name: field.id || '' });

  // Whenever Cohort ID changes, trigger validation on Age and Gender fields
  useEffect(() => {
    if (field.ageFieldId) trigger(field.ageFieldId);
    if (field.genderFieldId) trigger(field.genderFieldId);
  }, [cohortValue, trigger, field.ageFieldId, field.genderFieldId]);

  return (
    <div className="relative">
      <input 
        type="text" 
        className={`border p-4 rounded-xl bg-white w-full shadow-sm text-gray-800 focus:ring-4 outline-none transition ${errors[field.id] ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'}`} 
        placeholder={field.placeholder || "Enter Cohort ID (e.g. 1A-201)"} 
        {...register(field.id, validationRules)} 
      />
    </div>
  );
}
