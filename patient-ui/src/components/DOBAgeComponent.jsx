import React, { useEffect, useState } from 'react';

export function DOBAgeComponent({ field, value, onChange }) {
  const [dob, setDob] = useState(value?.dob || '');
  const [age, setAge] = useState(value?.age || '');

  useEffect(() => {
    if (value && value.dob !== dob) {
      setDob(value.dob);
      setAge(value.age);
    }
  }, [value]);

  const calculateAge = (dateString) => {
    if (!dateString) return '';
    const birthDate = new Date(dateString);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    
    return calculatedAge >= 0 ? calculatedAge : 0;
  };

  const handleDobChange = (e) => {
    const newDob = e.target.value;
    const newAge = calculateAge(newDob);
    
    setDob(newDob);
    setAge(newAge);
    
    onChange({ dob: newDob, age: newAge });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
          Date of Birth {field.required && <span className="text-rose-500">*</span>}
        </label>
        <input 
          type="date" 
          className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white text-slate-900"
          value={dob}
          onChange={handleDobChange}
        />
      </div>
      <div className="sm:w-1/3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
          Chronological Age
        </label>
        <div className="w-full border border-slate-200 p-2.5 text-sm rounded-lg bg-slate-50 text-slate-800 font-mono font-bold flex items-center">
          {age !== '' ? `${age} yrs` : '—'}
        </div>
      </div>
    </div>
  );
}
