import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  Upload,
  Calendar,
  CheckCircle2,
  Building2,
  ArrowRight,
  ShieldCheck,
  X,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { NavBar } from './NavBar';
import { readContext, writeContext, clearContext } from '../utils/context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function HomePage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [context, setContext] = useState({});
  const html5QrCode = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Read validated study/site session context
    const ctx = readContext();
    setContext(ctx);

    // Fetch submission telemetry
    fetch(`${API_URL}/patient/submissions`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSubmissions(Array.isArray(data) ? data : []))
      .catch(() => setSubmissions([]));

    return () => {
      if (html5QrCode.current?.isScanning) {
        html5QrCode.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    setScanError('');
    setIsScanning(true);

    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      setScanError('Camera optical access requires HTTPS protocol. Verify secure origin.');
      setIsScanning(false);
      return;
    }

    setTimeout(async () => {
      try {
        const readerElement = document.getElementById('home-qr-reader');
        if (!readerElement) {
          throw new Error('QR viewfinder viewport element not found in DOM.');
        }

        const devices = await Html5Qrcode.getCameras().catch((err) => {
          console.error('getCameras error:', err);
          throw new Error('Camera permissions denied. Grant camera authorization in browser site settings.');
        });

        if (!devices || devices.length === 0) {
          throw new Error('No optical camera hardware detected on this device.');
        }

        html5QrCode.current = new Html5Qrcode('home-qr-reader');
        const config = { fps: 15, qrbox: { width: 240, height: 240 } };
        const onSuccess = (decodedText) => handleScan(decodedText);

        const backCamera =
          devices.find(
            (device) =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
          ) || devices[devices.length - 1];

        try {
          await html5QrCode.current.start(backCamera.id, config, onSuccess, () => {});
        } catch {
          await html5QrCode.current.start({ facingMode: 'environment' }, config, onSuccess, () => {});
        }
      } catch (err) {
        console.error('Camera initialization failed:', err);
        setScanError(err.message || 'Optical sensor initialization failed.');
        setIsScanning(false);
      }
    }, 120);
  };

  const stopScanning = async () => {
    if (html5QrCode.current?.isScanning) {
      await html5QrCode.current.stop().catch(() => {});
    }
    setIsScanning(false);
  };

  const handleScan = async (url) => {
    await stopScanning();
    try {
      const parsed = new URL(url);
      const project = parsed.searchParams.get('project');
      const site = parsed.searchParams.get('site');
      const center = parsed.searchParams.get('center');
      if (project || site) {
        const ctx = { project, site, center };
        writeContext(ctx);
        navigate(`/forms?project=${project || ''}&site=${site || ''}${center ? '&center=' + center : ''}`);
      } else {
        navigate('/forms');
      }
    } catch {
      navigate('/forms');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError('');
    try {
      const scanner = new Html5Qrcode('home-qr-file-reader');
      const result = await scanner.scanFile(file, true);
      await scanner.clear();
      handleScan(result);
    } catch {
      setScanError('Unable to decode QR barcode from uploaded image. Please ensure sufficient contrast.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearContext = () => {
    clearContext();
    setContext({});
  };

  const validSubmissions = Array.isArray(submissions) ? submissions : [];
  const recentSubs = validSubmissions.slice(-4).reverse();
  const todayCount = validSubmissions.filter((s) => {
    const d = new Date(s.submitted_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const hasActiveSession = Boolean(context.project || context.site);

  return (
    <div className="min-h-screen radiant-canvas text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white relative overflow-hidden">
      <NavBar />

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Top Protocol Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200/80 mb-8">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-900 font-mono">
              Clinical Intake System
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-mono">v2.5.0</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Offline Encrypted Vault Active</span>
            </span>
          </div>
        </div>

        {/* Hero Clinical Header with Color Accents */}
        <section className="mb-8">
          <div className="radiant-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-100/60 via-emerald-50/20 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />

            <div className="max-w-3xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold mb-4 border border-teal-200/60">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Multi-Centre Participant Intake Protocol</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 leading-tight">
                Participant Form Intake &amp; Case Registry
              </h1>

              <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                Scan the clinical station QR code to load the assigned study protocol, record baseline
                observations, and synchronize clinical data with the central hospital registry.
              </p>
            </div>

            {/* Active Session Strip (Deep Forest/Teal Accent Banner) */}
            {hasActiveSession && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 rounded-xl p-5 text-white shadow-md">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-300 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                          Active Study Assignment
                        </span>
                        {context.site && (
                          <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-xs bg-emerald-400 text-slate-950 shadow-xs">
                            SITE {context.site}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/80 mt-1 font-mono">
                        {context.project && `Project: ${context.project}`}
                        {context.center && ` · Station: ${context.center}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      to="/forms"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white text-teal-900 text-xs font-bold hover:bg-teal-50 transition shadow-sm active:translate-y-[1px]"
                    >
                      <span>Open Assigned Forms</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={handleClearContext}
                      className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                      title="Clear Station Context"
                      aria-label="Clear session"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2-Column Work Surface: Optical QR Intake + Protocol Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Column A: Primary Action - Optical Scanner (7 Cols) */}
          <section className="lg:col-span-7 radiant-card rounded-2xl p-6 sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-950">Station Optical Scanner</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Point camera at the station QR code to link site metadata
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
            </div>

            {isScanning ? (
              <div className="mt-6 flex flex-col items-center">
                <div
                  id="home-qr-reader"
                  className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border-2 border-teal-600 bg-slate-950 shadow-inner"
                />
                <button
                  type="button"
                  onClick={stopScanning}
                  className="mt-4 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition"
                >
                  Terminate Scanner Viewport
                </button>
              </div>
            ) : (
              <div className="mt-6">
                {/* Precision Viewfinder Graphic with Emerald/Teal Reticles */}
                <div className="relative w-full py-10 bg-slate-50/80 border border-slate-200/90 rounded-xl flex flex-col items-center justify-center">
                  <div className="relative p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
                    {/* Viewfinder Target Ticks */}
                    <div className="absolute top-1 left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-teal-700" />
                    <div className="absolute top-1 right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-teal-700" />
                    <div className="absolute bottom-1 left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-teal-700" />
                    <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-teal-700" />

                    <QrCode className="w-12 h-12 text-teal-800 stroke-[1.25]" />
                  </div>
                  <p className="mt-4 text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
                    Ready for optical barcode capture
                  </p>
                </div>

                {/* Primary & Secondary Dual Action Pair */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={startScanning}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition active:translate-y-[1px] shadow-sm shadow-teal-700/20"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan with Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-teal-50/50 hover:border-teal-300 hover:text-teal-900 transition active:translate-y-[1px]"
                  >
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Upload Image File</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div id="home-qr-file-reader" className="hidden" />

                {scanError && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    {scanError}
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Manual protocol navigation:</span>
                  <Link
                    to="/forms"
                    className="font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Browse Available Forms</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Column B: Telemetry & Protocol Ledger (5 Cols) */}
          <section className="lg:col-span-5 space-y-6">
            {/* Color-Coded High-Density Telemetry Card Pair */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Card 1: Total Intakes (Sapphire Blue Accent) */}
              <div className="radiant-card rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Total Records
                  </span>
                  <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight text-slate-950 font-mono">
                  {validSubmissions.length}
                </div>
                <span className="text-[11px] text-blue-700 font-medium">Recorded intakes</span>
              </div>

              {/* Card 2: Today (Emerald Green Accent) */}
              <div className="radiant-card rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Today
                  </span>
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight text-slate-950 font-mono">
                  {todayCount}
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">Today's shift</span>
              </div>
            </div>

            {/* Recent Protocol Activity Ledger */}
            <div className="radiant-card rounded-xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Recent Protocol Records
                </h3>
                <span className="text-[11px] font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                  VAULT LOG
                </span>
              </div>

              {recentSubs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No records stored on this device yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 mt-2">
                  {recentSubs.map((sub) => {
                    const subDate = new Date(sub.submitted_at);
                    const formattedTime = !isNaN(subDate)
                      ? subDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Recently';
                    return (
                      <div key={sub.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-mono font-bold text-slate-900 truncate">
                            Record #{String(sub.id).padStart(4, '0')}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {formattedTime}
                            {sub.center_id ? ` · ${sub.center_id}` : ''}
                          </div>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>SYNCED</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {validSubmissions.length > 4 && (
                <div className="pt-3 border-t border-slate-100 mt-2 text-right">
                  <Link
                    to="/history"
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 hover:underline"
                  >
                    <span>View complete submission ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Clinical Platform System Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Halo<span className="text-teal-700">Health</span>Forms</span>
            <span className="text-slate-300">/</span>
            <span>Clinical Data Protocol</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <span>ISO 14155 GCP Architecture</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">Local Vault Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
