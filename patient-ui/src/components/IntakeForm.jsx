import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import { addSubmissionToQueue } from '../utils/storage';

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
          // Simulated GPS coords and signature for demo purposes
          gps_coordinates: { lat: 40.7128, lng: -74.0060 },
          signature: 'data:image/png;base64,demo_signature_string',
        }
      };

      if (!isOnline) {
        // Offline Queuing
        await addSubmissionToQueue(payload);
        setSubmitStatus('offline_success');
      } else {
        // Direct API Call Attempt (Simulated)
        // const response = await fetch('/api/submit', { ... });
        
        // For demo, we also queue it to let the sync logic handle it,
        // or just pretend it sent immediately.
        await addSubmissionToQueue(payload); 
        // In real app, maybe you just send it. If you add it to queue anyway, 
        // the auto-sync will pick it up. Let's just say it's queued.
        setSubmitStatus('online_success');
      }

      reset();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    } catch (error) {
      console.error('Error saving form:', error);
      setSubmitStatus('error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto my-4 border">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">General Intake Form</h2>
      
      {submitStatus === 'offline_success' && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded border border-green-200 text-sm font-medium">
          ✅ Form completed successfully! Your answers are saved locally and will automatically sync when you reconnect.
        </div>
      )}
      
      {submitStatus === 'online_success' && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded border border-blue-200 text-sm font-medium">
          🚀 Form submitted successfully!
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
          <input 
            {...register('patient_name', { required: 'Name is required' })} 
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Jane Doe"
          />
          {errors.patient_name && <span className="text-red-500 text-xs">{errors.patient_name.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input 
              type="number"
              {...register('height', { required: 'Height is required', min: 50, max: 300 })} 
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input 
              type="number"
              {...register('weight', { required: 'Weight is required', min: 10, max: 500 })} 
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded mt-4 transition-colors"
        >
          Submit Form
        </button>
      </form>
    </div>
  );
};
