import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export function QRScannerComponent({ field, onChange, setValue }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrCode = useRef(null);

  useEffect(() => {
    return () => {
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        html5QrCode.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    setError('');
    setIsScanning(true);
    
    try {
      html5QrCode.current = new Html5Qrcode(`qr-reader-${field.id}`);
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      const onSuccess = (decodedText) => handleScanSuccess(decodedText);
      const onError = () => {}; // Ignore frequent scan errors

      try {
        // Try rear camera first (phones/tablets)
        await html5QrCode.current.start({ facingMode: "environment" }, config, onSuccess, onError);
      } catch (err) {
        // Fallback to front camera (laptops)
        await html5QrCode.current.start({ facingMode: "user" }, config, onSuccess, onError);
      }
    } catch (err) {
      console.error(err);
      setError('Could not start camera. Please check permissions or try manual input.');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCode.current && html5QrCode.current.isScanning) {
      try {
        await html5QrCode.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleScanSuccess = async (decodedText) => {
    await stopScanning();
    
    // Attempt to parse JSON and map fields
    if (field.qrMappings && field.qrMappings.length > 0 && setValue) {
      try {
        const data = JSON.parse(decodedText);
        field.qrMappings.forEach(mapping => {
          if (mapping.qrKey && mapping.fieldId && data[mapping.qrKey] !== undefined) {
            setValue(mapping.fieldId, data[mapping.qrKey], { shouldValidate: true, shouldDirty: true });
          }
        });
        onChange(decodedText); // Set raw value for the scanner field itself
      } catch (e) {
        // Not valid JSON, just set the raw value
        onChange(decodedText);
      }
    } else {
      // No mappings or setValue, just set the raw value
      onChange(decodedText);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-inner">
      {isScanning ? (
        <div className="p-4 flex flex-col items-center">
          <div id={`qr-reader-${field.id}`} className="w-full max-w-sm mx-auto overflow-hidden rounded-lg shadow-md mb-4" />
          <button 
            type="button" 
            onClick={stopScanning}
            className="bg-red-50 text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-red-100 transition border border-red-200"
          >
            Cancel Scanning
          </button>
        </div>
      ) : (
        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          </div>
          <button 
            type="button" 
            onClick={startScanning}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow hover:shadow-md"
          >
            Open Camera & Scan QR
          </button>
          {error && <p className="text-red-500 text-sm font-medium mt-2">{error}</p>}
          
          <div className="w-full mt-2 pt-4 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Or enter data manually</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-50 text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
              placeholder="Enter fallback text..."
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
