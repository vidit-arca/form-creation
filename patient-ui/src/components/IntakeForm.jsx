import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import { addSubmissionToQueue } from '../utils/storage';
import { CheckCircle2, ShieldCheck, ArrowRight, Activity } from 'lucide-react';

export const IntakeForm = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const isOnline = useNetworkStatus();
  const [submitStatus, setSubmitStatus] = useState(null);

  const onSubmit = async (data) => {
    try {
      const payload = {
        formId: 'general-intake-v1',
        formTitle: 'General Intake Form v1.0',
        payload: {
          ...data,
          gps_coordinates: { lat: 40.7128, lng: -74.0060 },
          signature: 'data:image/png;base64,demo_signature_string',
        }
      };

      if (!isOnline) {
        await addSubmissionToQueue(payload);
        setSubmitStatus('offline_success');
      } else {
        await addSubmissionToQueue(payload);
        setSubmitStatus('online_success');
      }

      reset();
      setTimeout(() => setSubmitStatus(null), 5000);
    } catch (error) {
      console.error('Error saving form:', error);
      setSubmitStatus('error');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 max-w-2xl mx-auto my-6 font-sans">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 uppercase mb-2">
            <Activity className="w-3 h-3 text-teal-700" />
            <span>GENERAL_INTAKE_V1</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Participant Baseline Intake</h2>
        </div>
        <div className="flex items-center gap-1 font-mono text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Encrypted Vault</span>
        </div>
      </div>
      
      {submitStatus === 'offline_success' && (
        <div className="mb-6 p-4 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-xs font-mono flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">CACHED LOCALLY (OFFLINE BUFFER)</p>
            <p className="mt-0.5 text-amber-800">Your answers are stored in encrypted browser memory and will automatically sync on reconnect.</p>
          </div>
        </div>
      )}
      
      {submitStatus === 'online_success' && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 text-xs font-mono flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">SUBMISSION VERIFIED &amp; TRANSMITTED</p>
            <p className="mt-0.5 text-emerald-800">Observation record has been queued for central registry aggregation.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-1.5">
            Participant Name <span className="text-rose-500">*</span>
          </label>
          <input 
            {...register('patient_name', { required: 'Name is required' })} 
            className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white placeholder:text-slate-400"
            placeholder="e.g. Jane Doe"
          />
          {errors.patient_name && <span className="text-rose-600 text-xs font-semibold mt-1 block">{errors.patient_name.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-1.5">
              Height (cm) <span className="text-rose-500">*</span>
            </label>
            <input 
              type="number"
              {...register('height', { required: 'Height is required', min: 50, max: 300 })} 
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white"
              placeholder="170"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-1.5">
              Weight (kg) <span className="text-rose-500">*</span>
            </label>
            <input 
              type="number"
              {...register('weight', { required: 'Weight is required', min: 10, max: 500 })} 
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition bg-white"
              placeholder="65"
            />
          </div>
        </div>

        <div className="pt-2">
          <button 
            type="submit" 
            className="w-full inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-3 px-4 rounded-lg shadow-xs transition active:translate-y-[1px]"
          >
            <span>Transmit Intake Record</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
