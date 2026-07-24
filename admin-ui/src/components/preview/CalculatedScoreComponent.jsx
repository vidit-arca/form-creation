import React, { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { Parser } from 'expr-eval';

const _parser = new Parser();

const slugify = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

export function CalculatedScoreComponent({ field, control, schemaData, onChange }) {
  const [totalScore, setTotalScore] = useState(0);
  const [activeBadge, setActiveBadge] = useState(null);

  const isFormula = field.calculationMethod === 'formula';

  const formulaDeps = React.useMemo(() => {
    if (!isFormula || !field.formula) return [];
    const matches = field.formula.match(/\[([^\]]+)\]/g);
    if (!matches) return [];
    
    return matches.map(m => {
      const varName = m.slice(1, -1).trim();
      const sourceField = schemaData.find(f => (f.variableName || slugify(f.label) || f.id) === varName);
      return sourceField ? sourceField.id : null;
    }).filter(Boolean);
  }, [isFormula, field.formula, schemaData]);

  const fieldsToWatch = isFormula ? formulaDeps : (field.calculatedFields || []);

  const watchedValues = useWatch({
    control,
    name: fieldsToWatch
  });

  useEffect(() => {
    if (!isFormula && (!field.calculatedFields || field.calculatedFields.length === 0)) {
      setTotalScore(0);
      setActiveBadge(null);
      return;
    }

    let sum = 0;
    
    if (isFormula && field.formula) {
      let jsExpr = field.formula;
      let hasError = false;

      jsExpr = jsExpr.replace(/\[([^\]]+)\]/g, (match, rawVarName) => {
        const varName = rawVarName.trim();
        const sourceField = schemaData.find(f => (f.variableName || slugify(f.label) || f.id) === varName);
        if (!sourceField) return "(0)";
        
        const idx = fieldsToWatch.indexOf(sourceField.id);
        const val = watchedValues[idx];
        
        let numericVal = Number(val) || 0;
        
        // If the field has scoring enabled, use the option score instead of literal value
        if (sourceField && sourceField.enableScoring && sourceField.optionScores && val) {
          if (Array.isArray(val)) {
            numericVal = val.reduce((acc, v) => acc + (Number(sourceField.optionScores[v]) || 0), 0);
          } else if (sourceField.optionScores[val] !== undefined) {
            numericVal = Number(sourceField.optionScores[val]);
          }
        }
        return `(${numericVal})`;
      });

      try {
        sum = Number(_parser.parse(jsExpr).evaluate()) || 0;
      } catch (e) {
        sum = 0;
      }
    } else if (!isFormula) {
      // watchedValues is an array corresponding to the watched fields
      field.calculatedFields.forEach((fieldId, index) => {
        const selectedValue = watchedValues[index];
        if (selectedValue) {
          // Find the schema field to look up the score mapping
          const sourceField = schemaData.find(f => f.id === fieldId);
          
          if (sourceField && sourceField.enableScoring && sourceField.optionScores) {
            // If it's a multi-select, it might be an array
            if (Array.isArray(selectedValue)) {
              selectedValue.forEach(val => {
                if (sourceField.optionScores[val] !== undefined) {
                  sum += Number(sourceField.optionScores[val]);
                }
              });
            } else {
              // Single choice (radio, dropdown)
              if (sourceField.optionScores[selectedValue] !== undefined) {
                sum += Number(sourceField.optionScores[selectedValue]);
              }
            }
          } else if (selectedValue && !isNaN(Number(selectedValue))) {
            // It's a standard number field or calculated score output
            sum += Number(selectedValue);
          }
        }
      });
    }

    // Round to 2 decimal places to avoid floating point weirdness
    sum = Math.round(sum * 100) / 100;
    setTotalScore(sum);

    // Determine the badge based on thresholds
    let badge = null;
    if (field.scoreThresholds && field.scoreThresholds.length > 0) {
      // Find the first threshold that matches
      badge = field.scoreThresholds.find(t => sum >= t.min && sum <= t.max) || null;
    }
    setActiveBadge(badge);

    // Update the form state with the result
    if (onChange) {
      const breakdown = {};
      fieldsToWatch.forEach((fieldId, index) => {
        const sourceField = schemaData.find(f => f.id === fieldId);
        if (!sourceField) return;

        const val = watchedValues[index];
        let points = 0;

        if (val && sourceField.enableScoring && sourceField.optionScores) {
          if (Array.isArray(val)) {
            val.forEach(v => {
              if (sourceField.optionScores[v] !== undefined) points += Number(sourceField.optionScores[v]);
            });
          } else {
            if (sourceField.optionScores[val] !== undefined) points += Number(sourceField.optionScores[val]);
          }
        } else if (val && !isNaN(Number(val))) {
          points = Number(val);
        }

        // Generate a unique key - handle duplicate labels by appending a suffix
        let baseKey = sourceField.variableName || slugify(sourceField.label) || fieldId;
        let key = baseKey;
        let counter = 2;
        while (breakdown.hasOwnProperty(key)) {
          key = `${baseKey}_${counter}`;
          counter++;
        }

        breakdown[key] = {
          question: sourceField.label,
          answer: val || null,
          points: points
        };
      });

      onChange({ 
        score: sum, 
        label: badge ? badge.label : '',
        breakdown: breakdown,
        total_items: field.calculatedFields.length
      });
    }
  }, [watchedValues, field, schemaData, onChange]);

  const getBadgeColorClasses = (color) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="border border-gray-200 bg-blue-50 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-gray-800 font-bold">{field.label || 'Calculated Score'}</h3>
          {field.description && <p className="text-sm text-gray-500 mt-1">{field.description}</p>}
        </div>
        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-3xl font-black text-gray-800">{totalScore}</span>
          {activeBadge ? (
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border uppercase tracking-wider ${getBadgeColorClasses(activeBadge.color)}`}>
              {activeBadge.label}
            </span>
          ) : (
            <span className="px-4 py-1.5 rounded-full text-sm font-bold border uppercase tracking-wider bg-gray-100 text-gray-400 border-gray-200">
              --
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
