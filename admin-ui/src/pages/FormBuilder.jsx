import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { useHistory } from '../hooks/useHistory';
import { Toolbox } from '../components/builder/Toolbox';
import { Canvas } from '../components/builder/Canvas';
import { SettingsPanel } from '../components/builder/SettingsPanel';
import { FormPreview } from '../components/preview/FormPreview';

const API_URL = 'http://localhost:8000/api';

export function FormBuilder() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const { state: schemaData, set: setSchemaData, undo, redo } = useHistory([]);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetch(`${API_URL}/admin/forms/${id}`)
      .then(res => res.json())
      .then(data => {
        setForm(data);
        const draft = data.versions?.find(v => v.status === 'DRAFT');
        const published = data.versions?.find(v => v.status === 'PUBLISHED');
        const activeVersion = draft || published;
        if (activeVersion && activeVersion.schema_data && activeVersion.schema_data.length > 0) {
          setSchemaData(activeVersion.schema_data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load form:', err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = schemaData.findIndex((f) => f.id === active.id);
      const newIndex = schemaData.findIndex((f) => f.id === over.id);
      setSchemaData(arrayMove(schemaData, oldIndex, newIndex));
    }
  };

  const duplicateField = (field) => {
    const newField = JSON.parse(JSON.stringify(field));
    newField.id = `field_${Date.now()}`;
    const idx = schemaData.findIndex(f => f.id === field.id);
    const newData = [...schemaData];
    newData.splice(idx + 1, 0, newField);
    setSchemaData(newData);
    setActiveFieldId(newField.id);
  };

  const addField = (type) => {
    let label = `New ${type} field`;
    if (type === 'page_break') label = 'New Section';
    if (type === 'section_header') label = 'Section Heading';
    if (type === 'instruction') label = 'Instruction text goes here...';
    if (type === 'divider') label = 'Divider';
    if (type === 'signature') label = 'Please sign below';
    if (type === 'rating') label = 'Rate this';
    if (type === 'scale') label = 'Rate on a scale';
    if (type === 'gender') label = 'Gender';
    if (type === 'qr_scanner') label = 'Scan QR Code';
    if (type === 'gps') label = 'GPS Location';
    if (type === 'dob_age') label = 'Date of Birth';
    if (type === 'bmi') label = 'BMI Calculator';
    if (type === 'calculated_score') label = 'Calculated Score';
    if (type === 'cohort_input') label = 'Cohort ID';
    if (type === 'searchable_dropdown') label = 'Searchable Dropdown';
    if (type === 'searchable_multi_select') label = 'Searchable Multi-select';

    const isChoice = ['dropdown', 'radio', 'multi_select', 'checkbox', 'searchable_dropdown', 'searchable_multi_select'].includes(type);

    const newField = {
      id: `field_${Date.now()}`,
      type: type,
      label: label,
      description: '',
      placeholder: '',
      helpText: '',
      required: false,
      validation: {},
      options: type === 'gender' ? ['Male', 'Female', 'Other', 'Prefer not to say'] : ['Option 1', 'Option 2'],
      ...(isChoice ? { 
        enableScoring: false, 
        optionScores: { 'Option 1': 1, 'Option 2': 2 },
        enableExclusiveStop: false,
        exclusiveStopOptions: []
      } : {}),
      scale: { min: 1, max: 10, minLabel: 'Poor', maxLabel: 'Excellent' },
      ratingMax: 5,
      logic: { fieldId: '', operator: '==', value: '', action: 'show' },
      ...(type === 'qr_scanner' ? { qrMappings: [] } : {}),
      ...(type === 'bmi' ? { bmiUnit: 'metric' } : {}),
      ...(type === 'calculated_score' ? { 
        calculatedFields: [], 
        scoreThresholds: [{ min: 0, max: 10, label: 'Normal', color: 'green' }] 
      } : {}),
      ...(type === 'cohort_input' ? {
        ageFieldId: '',
        genderFieldId: '',
        cohortRules: []
      } : {})
    };
    setSchemaData([...schemaData, newField]);
    setActiveFieldId(newField.id);
  };

  const updateFieldId = (oldId, newId) => {
    if (!newId.trim()) return;
    if (schemaData.some(f => f.id === newId && f.id !== oldId)) return alert('Field ID must be unique');
    setSchemaData(schemaData.map(f => {
      if (f.id === oldId) return { ...f, id: newId };
      if (f.logic && f.logic.fieldId === oldId) return { ...f, logic: { ...f.logic, fieldId: newId } };
      return f;
    }));
    setActiveFieldId(newId);
  };

  const updateField = (fieldId, updates) => {
    setSchemaData(schemaData.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const saveDraft = async () => {
    const draft = form.versions?.find(v => v.status === 'DRAFT');
    if (!draft) return alert("No draft version found");
    
    await fetch(`${API_URL}/admin/forms/${id}/versions/${draft.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema_data: schemaData,
        ui_schema: {},
        logic_schema: []
      })
    });
    alert('Draft saved!');
  };

  const publishForm = async () => {
    await saveDraft();
    await fetch(`${API_URL}/admin/forms/${id}/publish`, {
      method: 'POST'
    });
    alert('Form published!');
  };

  if (loading) return <div className="p-8 flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  const activeField = schemaData.find(f => f.id === activeFieldId);

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <Toolbox 
        addField={addField} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />
      
      <div className="flex-1 flex flex-col relative">
        <div className="h-16 bg-white border-b border-gray-200 px-6 flex justify-between items-center shadow-sm z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{form.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-lg mr-4">
              <button onClick={() => setPreviewMode(false)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${!previewMode ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Builder</button>
              <button onClick={() => setPreviewMode(true)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${previewMode ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Preview</button>
            </div>
            <button onClick={saveDraft} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm text-sm font-medium">Save Draft</button>
            <button onClick={publishForm} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm text-sm font-medium">Publish Form</button>
          </div>
        </div>

        {previewMode ? (
          <div className="flex-1 overflow-y-auto p-8">
            <FormPreview schemaData={schemaData} title={form.title} />
          </div>
        ) : (
          <Canvas 
            schemaData={schemaData} 
            activeFieldId={activeFieldId} 
            setActiveFieldId={setActiveFieldId} 
            duplicateField={duplicateField} 
            handleDragEnd={handleDragEnd} 
            sensors={sensors}
          />
        )}
      </div>

      {!previewMode && (
        <SettingsPanel 
          activeField={activeField} 
          activeFieldId={activeFieldId} 
          setActiveFieldId={setActiveFieldId} 
          updateField={updateField} 
          updateFieldId={updateFieldId} 
          schemaData={schemaData} 
          setSchemaData={setSchemaData} 
        />
      )}
    </div>
  );
}
