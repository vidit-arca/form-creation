export function validateCohortRules(value, formValues, field) {
  if (!value) return true; // Let the 'required' rule handle empty values

  const { ageFieldId, genderFieldId, cohortRules } = field;
  if (!ageFieldId || !genderFieldId || !cohortRules || cohortRules.length === 0) {
    return true; // No rules configured
  }

  // Extract prefix (assumes format PREFIX-NUMBER, e.g. 1A-201)
  const prefix = value.split('-')[0].trim().toUpperCase();

  // Get Age
  let currentAge = null;
  const ageFieldValue = formValues[ageFieldId];
  if (ageFieldValue !== undefined && ageFieldValue !== null && ageFieldValue !== '') {
    if (typeof ageFieldValue === 'object' && ageFieldValue.age !== undefined && ageFieldValue.age !== '') {
      currentAge = Number(ageFieldValue.age);
    } else if (typeof ageFieldValue !== 'object') {
      currentAge = Number(ageFieldValue);
    }
  }

  // Get Gender
  let currentGender = formValues[genderFieldId];
  if (typeof currentGender === 'string') {
    currentGender = currentGender.trim().toLowerCase();
  }

  if (currentAge === null || isNaN(currentAge) || !currentGender) {
    return true; // Don't validate until both Age and Gender are filled
  }

  // Find matching rule
  let matchedPrefix = null;

  const matchedRule = cohortRules.find(rule => {
    const min = rule.minAge === '' || rule.minAge === null ? -Infinity : Number(rule.minAge);
    const max = rule.maxAge === '' || rule.maxAge === null ? Infinity : Number(rule.maxAge);
    
    if (currentAge >= min && currentAge <= max) {
      // Handle comma-separated gender values (e.g. "Male, Female")
      const gVals = (rule.genderValue || '').split(',').map(s => s.trim().toLowerCase());
      const pVals = (rule.prefix || '').split(',').map(s => s.trim().toUpperCase());
      
      const genderIndex = gVals.indexOf(currentGender);
      if (genderIndex !== -1) {
        // Find corresponding prefix by index (or fallback to first if mismatched)
        matchedPrefix = pVals[genderIndex] || pVals[0] || '';
        return true;
      }
    }
    return false;
  });

  if (!matchedRule) {
    return 'No cohort classification exists for the current Age and Gender.';
  }

  if (prefix !== matchedPrefix) {
    return `Cohort classification does not match Age and Gender. Expected prefix: ${matchedPrefix}`;
  }

  return true;
}
