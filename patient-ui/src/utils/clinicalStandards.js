/**
 * Clinical Reference Standards & Physiological Value Evaluator
 * Based on WHO, American Heart Association (AHA), and American Diabetes Association (ADA) guidelines.
 */

export const CLINICAL_REFERENCE_STANDARDS = {
  // Blood Pressure Systolic (mmHg)
  bp_systolic: {
    label: 'Systolic Blood Pressure',
    unit: 'mmHg',
    evaluate: (val) => {
      const num = Number(val);
      if (isNaN(num)) return null;
      if (num >= 180) return { status: 'alert', text: 'Hypertensive Crisis', critical: true };
      if (num >= 140) return { status: 'warning', text: 'Stage 2 Hypertension' };
      if (num >= 130) return { status: 'warning', text: 'Stage 1 Hypertension' };
      if (num >= 120) return { status: 'warning', text: 'Elevated' };
      if (num < 90) return { status: 'warning', text: 'Hypotension' };
      return { status: 'optimal', text: 'Optimal' };
    },
  },

  // Blood Pressure Diastolic (mmHg)
  bp_diastolic: {
    label: 'Diastolic Blood Pressure',
    unit: 'mmHg',
    evaluate: (val) => {
      const num = Number(val);
      if (isNaN(num)) return null;
      if (num >= 120) return { status: 'alert', text: 'Hypertensive Crisis', critical: true };
      if (num >= 90) return { status: 'warning', text: 'Stage 2 Hypertension' };
      if (num >= 80) return { status: 'warning', text: 'Stage 1 Hypertension' };
      if (num < 60) return { status: 'warning', text: 'Low Diastolic' };
      return { status: 'optimal', text: 'Optimal' };
    },
  },

  // Heart Rate / Pulse (bpm)
  heart_rate: {
    label: 'Heart Rate / Pulse',
    unit: 'bpm',
    evaluate: (val) => {
      const num = Number(val);
      if (isNaN(num)) return null;
      if (num > 130) return { status: 'alert', text: 'Severe Tachycardia', critical: true };
      if (num > 100) return { status: 'warning', text: 'Tachycardia' };
      if (num < 50) return { status: 'warning', text: 'Bradycardia' };
      return { status: 'optimal', text: 'Normal' };
    },
  },

  // Oxygen Saturation SpO2 (%)
  spo2: {
    label: 'Oxygen Saturation (SpO2)',
    unit: '%',
    evaluate: (val) => {
      const num = Number(val);
      if (isNaN(num)) return null;
      if (num < 90) return { status: 'alert', text: 'Severe Hypoxia', critical: true };
      if (num < 95) return { status: 'warning', text: 'Low Saturation' };
      return { status: 'optimal', text: 'Normal' };
    },
  },

  // Respiratory Rate (breaths/min)
  respiratory_rate: {
    label: 'Respiratory Rate',
    unit: 'breaths/min',
    evaluate: (val) => {
      const num = Number(val);
      if (isNaN(num)) return null;
      if (num > 24) return { status: 'alert', text: 'Tachypnea', critical: true };
      if (num < 12) return { status: 'warning', text: 'Bradypnea' };
      return { status: 'optimal', text: 'Normal' };
    },
  },

  // Body Temperature (°C)
  temperature_c: {
    label: 'Body Temperature',
    unit: '°C',
    evaluate: (val) => {
      const num = Number(val);
      if (isNaN(num)) return null;
      if (num >= 38.5) return { status: 'alert', text: 'High Fever', critical: true };
      if (num >= 37.5) return { status: 'warning', text: 'Low-Grade Fever' };
      if (num < 35.5) return { status: 'alert', text: 'Hypothermia', critical: true };
      return { status: 'optimal', text: 'Normal' };
    },
  },

  // Body Mass Index (BMI)
  bmi: {
    label: 'Body Mass Index (BMI)',
    unit: 'kg/m²',
    evaluate: (val) => {
      const num = Number(val);
      if (isNaN(num)) return null;
      if (num >= 35) return { status: 'alert', text: 'Class II/III Obese', critical: true };
      if (num >= 30) return { status: 'warning', text: 'Class I Obese' };
      if (num >= 25) return { status: 'warning', text: 'Overweight' };
      if (num < 18.5) return { status: 'warning', text: 'Underweight' };
      return { status: 'optimal', text: 'Normal Weight' };
    },
  },

  // Fasting Blood Glucose (mg/dL)
  fasting_glucose: {
    label: 'Fasting Blood Glucose',
    unit: 'mg/dL',
    evaluate: (val) => {
      const num = Number(val);
      if (isNaN(num)) return null;
      if (num < 70) return { status: 'alert', text: 'Hypoglycemia', critical: true };
      if (num >= 126) return { status: 'alert', text: 'Diabetic Range', critical: true };
      if (num >= 100) return { status: 'warning', text: 'Pre-diabetes / Impaired' };
      return { status: 'optimal', text: 'Normal' };
    },
  },

  // Random / Postprandial Glucose (mg/dL)
  random_glucose: {
    label: 'Postprandial / Random Glucose',
    unit: 'mg/dL',
    evaluate: (val) => {
      const num = Number(val);
      if (isNaN(num)) return null;
      if (num < 70) return { status: 'alert', text: 'Hypoglycemia', critical: true };
      if (num >= 200) return { status: 'alert', text: 'Severe Hyperglycemia', critical: true };
      if (num >= 140) return { status: 'warning', text: 'Elevated Postprandial' };
      return { status: 'optimal', text: 'Normal' };
    },
  },

  // Glycated Hemoglobin HbA1c (%)
  hba1c: {
    label: 'Glycated Hemoglobin (HbA1c)',
    unit: '%',
    evaluate: (val) => {
      const num = Number(val);
      if (isNaN(num)) return null;
      if (num >= 9.0) return { status: 'alert', text: 'Uncontrolled Diabetes', critical: true };
      if (num >= 6.5) return { status: 'warning', text: 'Diabetic Range' };
      if (num >= 5.7) return { status: 'warning', text: 'Pre-diabetes' };
      return { status: 'optimal', text: 'Normal' };
    },
  },

  // Total Cholesterol (mg/dL)
  total_cholesterol: {
    label: 'Total Cholesterol',
    unit: 'mg/dL',
    evaluate: (val) => {
      const num = Number(val);
      if (isNaN(num)) return null;
      if (num >= 240) return { status: 'alert', text: 'High Risk', critical: true };
      if (num >= 200) return { status: 'warning', text: 'Borderline High' };
      return { status: 'optimal', text: 'Desirable' };
    },
  },

  // Serum Creatinine (mg/dL)
  serum_creatinine: {
    label: 'Serum Creatinine',
    unit: 'mg/dL',
    evaluate: (val) => {
      const num = Number(val);
      if (isNaN(num)) return null;
      if (num > 1.4) return { status: 'warning', text: 'Elevated (Renal Watch)' };
      if (num < 0.5) return { status: 'warning', text: 'Low' };
      return { status: 'optimal', text: 'Normal' };
    },
  },
};

/**
 * Normalizes string keys and variable names to match standard physiological metrics
 */
export function matchClinicalStandard(fieldName, label, type) {
  if (type === 'bmi') return 'bmi';

  const clean = `${fieldName} ${label || ''}`.toLowerCase().replace(/[^a-z0-9]/g, ' ');

  // Systolic BP
  if (clean.includes('systolic') || clean.includes('bp sys') || clean.includes('bpsys') || clean.includes('sbp')) {
    return 'bp_systolic';
  }
  // Diastolic BP
  if (clean.includes('diastolic') || clean.includes('bp dia') || clean.includes('bpdia') || clean.includes('dbp')) {
    return 'bp_diastolic';
  }
  // Pulse / Heart Rate
  if (clean.includes('heart rate') || clean.includes('pulse') || clean.includes('bpm') || clean.includes('hr')) {
    return 'heart_rate';
  }
  // SpO2
  if (clean.includes('spo2') || clean.includes('oxygen sat') || clean.includes('o2 sat')) {
    return 'spo2';
  }
  // Respiratory
  if (clean.includes('respiratory') || clean.includes('resp rate') || clean.includes('rr')) {
    return 'respiratory_rate';
  }
  // Temperature
  if (clean.includes('temp') || clean.includes('temperature') || clean.includes('fever')) {
    return 'temperature_c';
  }
  // BMI
  if (clean.includes('bmi') || clean.includes('body mass index')) {
    return 'bmi';
  }
  // Fasting glucose
  if (clean.includes('fasting') && (clean.includes('glucose') || clean.includes('sugar') || clean.includes('fbs'))) {
    return 'fasting_glucose';
  }
  // Postprandial / Random glucose
  if (clean.includes('glucose') || clean.includes('blood sugar') || clean.includes('rbs') || clean.includes('ppbs')) {
    return 'random_glucose';
  }
  // HbA1c
  if (clean.includes('hba1c') || clean.includes('a1c') || clean.includes('glycated')) {
    return 'hba1c';
  }
  // Cholesterol
  if (clean.includes('cholesterol') || clean.includes('lipid')) {
    return 'total_cholesterol';
  }
  // Creatinine
  if (clean.includes('creatinine') || clean.includes('serum cr')) {
    return 'serum_creatinine';
  }

  return null;
}

/**
 * Classifies a schema field into a primary physiological domain
 */
export function classifyFieldDomain(field) {
  const { id, type, label, variableName } = field;
  const nameToMatch = `${id} ${variableName || ''} ${label || ''}`.toLowerCase();

  // 1. Hemodynamics & Vitals
  if (
    matchClinicalStandard(id, label, type) &&
    ['bp_systolic', 'bp_diastolic', 'heart_rate', 'spo2', 'respiratory_rate', 'temperature_c'].includes(
      matchClinicalStandard(id, label, type)
    )
  ) {
    return 'hemodynamics';
  }
  if (nameToMatch.includes('vitals') || nameToMatch.includes('blood pressure') || nameToMatch.includes('pulse')) {
    return 'hemodynamics';
  }

  // 2. Anthropometrics & Body Composition
  if (type === 'bmi') return 'anthropometrics';
  if (
    nameToMatch.includes('height') ||
    nameToMatch.includes('weight') ||
    nameToMatch.includes('waist') ||
    nameToMatch.includes('hip') ||
    nameToMatch.includes('circumference')
  ) {
    return 'anthropometrics';
  }

  // 3. Metabolic & Lab Biomarkers
  if (
    matchClinicalStandard(id, label, type) &&
    ['fasting_glucose', 'random_glucose', 'hba1c', 'total_cholesterol', 'serum_creatinine'].includes(
      matchClinicalStandard(id, label, type)
    )
  ) {
    return 'metabolic';
  }
  if (
    nameToMatch.includes('glucose') ||
    nameToMatch.includes('sugar') ||
    nameToMatch.includes('hba1c') ||
    nameToMatch.includes('lab') ||
    nameToMatch.includes('biomarker') ||
    nameToMatch.includes('cholesterol') ||
    nameToMatch.includes('hemoglobin')
  ) {
    return 'metabolic';
  }

  // 4. Clinical Calculated Risk Scores & Stratification
  if (type === 'calculated_score') return 'scores';
  if (type === 'cohort_input') return 'scores';
  if (nameToMatch.includes('score') || nameToMatch.includes('risk') || nameToMatch.includes('cohort')) {
    return 'scores';
  }

  // 5. Demographics, Identifiers & Context
  if (type === 'dob_age') return 'demographics';
  if (type === 'gps') return 'demographics';
  if (type === 'qr_scanner') return 'demographics';
  if (
    nameToMatch.includes('age') ||
    nameToMatch.includes('dob') ||
    nameToMatch.includes('gender') ||
    nameToMatch.includes('sex') ||
    nameToMatch.includes('patient_name') ||
    nameToMatch.includes('participant')
  ) {
    return 'demographics';
  }

  // 6. Signatures & Attestations
  if (type === 'signature') return 'attestation';

  // 7. General Questions / Uncategorized Observations
  return 'general';
}

