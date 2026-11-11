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
    if (cat === 'Underweight') return 'bg-sky-50 text-sky-800 border-sky-200';
    if (cat === 'Normal') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (cat === 'Overweight') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (cat === 'Obese') return 'bg-rose-50 text-rose-800 border-rose-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row gap-4 mb-3">
        <div className="flex-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
            Height ({heightUnit}) {field.required && <span className="text-rose-500">*</span>}
          </label>
          <input 
            type="number" 
            className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
            value={height}
            placeholder={`e.g. ${isMetric ? '175' : '70'}`}
            onChange={(e) => handleUpdate(parseFloat(e.target.value) || '', weight)}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
            Weight ({weightUnit}) {field.required && <span className="text-rose-500">*</span>}
          </label>
          <input 
            type="number" 
            className="w-full border border-slate-300 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
            value={weight}
            placeholder={`e.g. ${isMetric ? '70' : '150'}`}
            onChange={(e) => handleUpdate(height, parseFloat(e.target.value) || '')}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
          Biometric Score:
        </div>
        <div className="flex items-center gap-2.5">
          {bmi ? (
            <>
              <span className="text-xl font-mono font-black text-slate-950">{bmi}</span>
              <span className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold border ${getCategoryColor(category)} uppercase tracking-wider`}>
                {category}
              </span>
            </>
          ) : (
            <span className="text-xs font-mono text-slate-400">Awaiting inputs</span>
          )}
        </div>
      </div>
    </div>
  );
}
