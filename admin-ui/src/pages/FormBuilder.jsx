import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import {
  ArrowLeft,
  Eye,
  Hammer,
  Save,
  Send,
  Undo2,
  Redo2
} from 'lucide-react';
import { useHistory } from '../hooks/useHistory';
import { Toolbox } from '../components/builder/Toolbox';
import { Canvas } from '../components/builder/Canvas';
import { SettingsPanel } from '../components/builder/SettingsPanel';
import { FormPreview } from '../components/preview/FormPreview';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function FormBuilder() {
  const { id, projectId } = useParams();
  const [form, setForm] = useState(null);
  const { state: schemaData, set: setSchemaData, undo, redo } = useHistory([]);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetch(`${API_URL}/admin/forms/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm(data);
        const draft = data.versions?.find((v) => v.status === 'DRAFT');
        const published = data.versions?.find((v) => v.status === 'PUBLISHED');
        const activeVersion = draft || published;
        if (activeVersion && activeVersion.schema_data && activeVersion.schema_data.length > 0) {
          setSchemaData(activeVersion.schema_data);
        }
        setLoading(false);
      })
      .catch((err) => {
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
    const idx = schemaData.findIndex((f) => f.id === field.id);
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
    if (type === 'dob_age') label = 'Date of Birth & Age';
    if (type === 'bmi') label = 'Body Mass Index (BMI)';
    if (type === 'gps') label = 'GPS Coordinates';
    if (type === 'calculated_score') label = 'Calculated Total Score';
    if (type === 'cohort_input') label = 'Cohort / Site Code';
    if (type === 'dietary_recall_24h') label = '24-Hour Dietary Recall Assessment';

    const newField = {
      id: `field_${Date.now()}`,
      type,
      label,
      placeholder: '',
      required: false,
      options: [
        'dropdown',
        'searchable_dropdown',
        'radio',
        'checkbox',
        'multi_select',
        'searchable_multi_select',
      ].includes(type)
        ? ['Option 1', 'Option 2']
        : type === 'gender'
        ? ['Male', 'Female', 'Other', 'Prefer not to say']
        : [],
      validation: {},
      scale: type === 'scale' ? { min: 1, max: 10, minLabel: 'Poor', maxLabel: 'Excellent' } : null,
      ratingMax: type === 'rating' ? 5 : null,
      bmiUnit: type === 'bmi' ? 'metric' : null,
      calculatedFields: type === 'calculated_score' ? [] : null,
      scoreThresholds: type === 'calculated_score' ? [] : null,
      calculationMethod: type === 'calculated_score' ? 'sum' : null,
      formula: type === 'calculated_score' ? '' : null,
      enableScoring: false,
      optionScores: {},
    };

    setSchemaData([...schemaData, newField]);
    setActiveFieldId(newField.id);
  };

  const updateField = (id, updates) => {
    setSchemaData(
      schemaData.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const updateFieldId = (oldId, newId) => {
    if (!newId || newId === oldId) return;

    if (schemaData.some((f) => f.id === newId)) {
      alert('Field ID already exists. Please choose a unique ID.');
      return;
    }

    setSchemaData(
      schemaData.map((f) => {
        if (f.id === oldId) return { ...f, id: newId };
        if (f.logic && f.logic.conditions) {
          const updatedConditions = f.logic.conditions.map((c) =>
            c.fieldId === oldId ? { ...c, fieldId: newId } : c
          );
          return { ...f, logic: { ...f.logic, conditions: updatedConditions } };
        }
        if (f.type === 'calculated_score' && f.calculatedFields) {
          return {
            ...f,
            calculatedFields: f.calculatedFields.map((cid) => (cid === oldId ? newId : cid)),
          };
        }
        return f;
      })
    );

    if (activeFieldId === oldId) {
      setActiveFieldId(newId);
    }
  };

  const saveDraft = async () => {
    setIsSaving(true);
    const draft = form?.versions?.find((v) => v.status === 'DRAFT');
    if (!draft) {
      setIsSaving(false);
      return alert('No draft version found.');
    }

    try {
      await fetch(`${API_URL}/admin/forms/${id}/versions/${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema_data: schemaData,
          ui_schema: {},
          logic_schema: [],
        }),
      });
      setIsSaving(false);
      alert('Draft schema synchronized successfully.');
    } catch {
      setIsSaving(false);
      alert('Failed to synchronize draft schema.');
    }
  };

  const publishForm = async () => {
    await saveDraft();
    try {
      await fetch(`${API_URL}/admin/forms/${id}/publish`, {
        method: 'POST',
      });
      alert('Form protocol published live. Ready for participant intake.');
    } catch {
      alert('Publishing failed.');
    }
  };

  const backLink = projectId ? `/projects/${projectId}` : '/';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-xs text-blue-800">
        <span className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3 mr-3" />
        <span>INITIALIZING CLINICAL FORM BUILDER...</span>
      </div>
    );
  }

  const activeField = schemaData.find((f) => f.id === activeFieldId);

  return (
    <div className="flex h-screen radiant-canvas font-sans antialiased overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* ─── Left: Drag-and-Drop Toolbox ─── */}
      <Toolbox
        addField={addField}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* ─── Center: Canvas / Preview Area ─── */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Builder Control Header */}
        <header className="h-16 radiant-header px-6 flex justify-between items-center shadow-xs z-20">
          <div className="flex items-center gap-3">
            <Link
              to={backLink}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Return to Study Project"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-950 truncate max-w-sm">
                  {form.title}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  ID: #{id}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {schemaData.length} schema fields configured
              </p>
            </div>
          </div>

          {/* Center/Right Actions: Undo/Redo, Switcher, Save & Publish */}
          <div className="flex items-center gap-3">
            {/* Undo / Redo */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={undo}
                aria-label="Undo recent modification"
                className="p-1 rounded text-slate-600 hover:text-slate-950 hover:bg-white transition cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={redo}
                aria-label="Redo recent modification"
                className="p-1 rounded text-slate-600 hover:text-slate-950 hover:bg-white transition cursor-pointer"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Builder / Preview Toggle Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setPreviewMode(false)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  !previewMode
                    ? 'bg-white shadow-2xs text-blue-900 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Designer</span>
              </button>
              <button
                onClick={() => setPreviewMode(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  previewMode
                    ? 'bg-white shadow-2xs text-blue-900 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={saveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3.5 py-1.5 rounded-lg hover:bg-slate-50 transition active:translate-y-[1px] text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{isSaving ? 'Syncing...' : 'Save Draft'}</span>
            </button>

            <button
              onClick={publishForm}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition active:translate-y-[1px] text-xs font-semibold shadow-sm shadow-blue-600/20 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Protocol</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        {previewMode ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-50">
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

      {/* ─── Right: Inspector & Settings Panel ─── */}
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
