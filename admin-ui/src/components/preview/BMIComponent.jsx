import React, { useEffect, useState } from 'react';

export function BMIComponent({ field, value, onChange }) {
  const [height, setHeight] = useState(value?.height || '');
  const [weight, setWeight] = useState(value?.weight || '');
  const [bmi, setBmi] = useState(value?.bmi || null);
  const [category, setCategory] = useState(value?.category || '');

  const isMetric = field.bmiUnit !== 'imperial';
  const heightUnit = isMetric ? 'cm' : 'in';
  const weightUnit = isMetric ? 'kg' : 'lbs';

  useEffect(() => {
    if (value) {
      if (value.height !== undefined) setHeight(value.height);
      if (value.weight !== undefined) setWeight(value.weight);
      if (value.bmi !== undefined) setBmi(value.bmi);
      if (value.category !== undefined) setCategory(value.category);
    }
  }, [value]);

  const calculateBMI = (h, w) => {
    if (!h || !w || h <= 0 || w <= 0) return { score: null, cat: '' };
    
    let score = 0;
    if (isMetric) {
      const heightInMeters = h / 100;
      score = w / (heightInMeters * heightInMeters);
    } else {
      score = (w / (h * h)) * 703;
    }
    
    score = Math.round(score * 10) / 10;
    
    let cat = '';
    if (score < 18.5) cat = 'Underweight';
    else if (score >= 18.5 && score <= 24.9) cat = 'Normal';
    else if (score >= 25 && score <= 29.9) cat = 'Overweight';
    else if (score >= 30) cat = 'Obese';

    return { score, cat };
  };

  const handleUpdate = (newHeight, newWeight) => {
    const { score, cat } = calculateBMI(newHeight, newWeight);
    setHeight(newHeight);
    setWeight(newWeight);
    setBmi(score);
    setCategory(cat);
    
    onChange({
      height: newHeight,
      weight: newWeight,
      bmi: score,
      category: cat
    });
  };

  const getCategoryColor = (cat) => {
    if (cat === 'Underweight') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (cat === 'Normal') return 'bg-green-100 text-green-800 border-green-200';
    if (cat === 'Overweight') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (cat === 'Obese') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label className="text-sm font-bold text-gray-700 block mb-2">Height ({heightUnit}) {field.required && <span className="text-red-500">*</span>}</label>
          <input 
            type="number" 
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
            value={height}
            placeholder={`e.g. ${isMetric ? '175' : '70'}`}
            onChange={(e) => handleUpdate(parseFloat(e.target.value) || '', weight)}
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-bold text-gray-700 block mb-2">Weight ({weightUnit}) {field.required && <span className="text-red-500">*</span>}</label>
          <input 
            type="number" 
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
            value={weight}
            placeholder={`e.g. ${isMetric ? '70' : '150'}`}
            onChange={(e) => handleUpdate(height, parseFloat(e.target.value) || '')}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
        <div className="text-sm font-bold text-gray-700">Calculated BMI:</div>
        <div className="flex items-center gap-3">
          {bmi ? (
            <>
              <span className="text-2xl font-black text-gray-800">{bmi}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(category)} uppercase tracking-wider`}>
                {category}
              </span>
            </>
          ) : (
            <span className="text-gray-400 font-medium">Enter height and weight</span>
          )}
        </div>
      </div>
    </div>
  );
}
