import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export function QRScannerComponent({ field, onChange, setValue }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
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

    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      setError('Camera access requires HTTPS. Please load this page with https:// in your URL.');
      setIsScanning(false);
      return;
    }

    // Wait for React to render the container element in the DOM
    setTimeout(async () => {
      try {
        const readerElement = document.getElementById(`qr-reader-${field.id}`);
        if (!readerElement) {
          throw new Error('QR reader container element not found in DOM');
        }

        // Trigger native camera permission dialog by requesting cameras first
        const devices = await Html5Qrcode.getCameras().catch(err => {
          console.error("getCameras failed", err);
          throw new Error('Camera permissions denied or blocked. Please reset your browser site permissions.');
        });

        if (!devices || devices.length === 0) {
          throw new Error('No camera devices found on this device.');
        }

        html5QrCode.current = new Html5Qrcode(`qr-reader-${field.id}`);
        const config = {
          fps: 15,
          qrbox: (width, height) => {
            const minEdge = Math.min(width, height);
            const size = Math.floor(minEdge * 0.7);
            return { width: size, height: size };
          }
        };
        const onSuccess = (decodedText) => handleScanSuccess(decodedText);
        const onError = () => { }; // Ignore frequent scan errors

        // Find the back/rear camera if available
        const backCamera = devices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        ) || devices[devices.length - 1]; // Fallback to the last camera (often rear)

        try {
          await html5QrCode.current.start(backCamera.id, config, onSuccess, onError);
        } catch {
          // Fallback to facingMode if starting by device ID fails
          await html5QrCode.current.start({ facingMode: "environment" }, config, onSuccess, onError);
        }
      } catch (err) {
        console.error('Camera initialization failed:', err);
        setError(err.message || 'Could not start camera. Please check permissions.');
        setIsScanning(false);
      }
    }, 150);
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
      } catch (e) {
        // Fallback: If it's a plain string and not JSON (like a simple barcode),
        // automatically copy the entire raw string to all target mapped fields!
        field.qrMappings.forEach(mapping => {
          if (mapping.fieldId) {
            setValue(mapping.fieldId, decodedText, { shouldValidate: true, shouldDirty: true });
          }
        });
      }
      onChange(decodedText); // Set raw value for the scanner field itself
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
