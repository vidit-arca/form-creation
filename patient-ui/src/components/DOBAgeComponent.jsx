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
        <label className="text-sm font-bold text-gray-700 block mb-2">Date of Birth {field.required && <span className="text-red-500">*</span>}</label>
        <input 
          type="date" 
          className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
          value={dob}
          onChange={handleDobChange}
        />
      </div>
      <div className="sm:w-1/3">
        <label className="text-sm font-bold text-gray-700 block mb-2">Age</label>
        <div className="w-full border border-gray-200 p-3 rounded-lg bg-gray-50 text-gray-600 font-medium h-[50px] flex items-center">
          {age !== '' ? `${age} years` : '--'}
        </div>
      </div>
    </div>
  );
}
