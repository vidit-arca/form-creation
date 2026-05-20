import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

const API_URL = 'http://localhost:8000/api';

export function HomePage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [context, setContext] = useState({});
  const html5QrCode = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Check for existing context
    try {
      const ctx = JSON.parse(localStorage.getItem('haloform_context')) || {};
      setContext(ctx);
    } catch {}

    // Fetch submission count for analytics
    fetch(`${API_URL}/patient/submissions`)
      .then(r => r.json())
      .then(data => setSubmissions(data))
      .catch(() => {});

    return () => {
      if (html5QrCode.current?.isScanning) {
        html5QrCode.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    setScanError('');
    setIsScanning(true);
    try {
      html5QrCode.current = new Html5Qrcode('home-qr-reader');
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      const onSuccess = (decodedText) => handleScan(decodedText);
      try {
        await html5QrCode.current.start({ facingMode: "environment" }, config, onSuccess, () => {});
      } catch {
        await html5QrCode.current.start({ facingMode: "user" }, config, onSuccess, () => {});
      }
    } catch {
      setScanError('Could not access camera. Check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCode.current?.isScanning) {
      await html5QrCode.current.stop().catch(() => {});
      setIsScanning(false);
    }
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
        localStorage.setItem('haloform_context', JSON.stringify(ctx));
        navigate(`/forms?project=${project || ''}&site=${site || ''}${center ? '&center=' + center : ''}`);
      } else {
        navigate('/forms');
      }
    } catch {
      // Not a valid URL, just go to forms
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
      setScanError('Could not read QR from image. Try a clearer photo.');
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearContext = () => {
    localStorage.removeItem('haloform_context');
    setContext({});
  };

  const recentSubs = submissions.slice(-3).reverse();
  const todayCount = submissions.filter(s => {
    const d = new Date(s.submitted_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-emerald-100/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent tracking-tight">HaloHealthForms</span>
          </div>
          <Link to="/history" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-200/60 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            My Submissions
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-10 mb-10 shadow-xl shadow-emerald-600/10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-white rounded-full"></div>
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">Welcome to Your<br />Health Portal</h1>
            <p className="text-emerald-100 mt-3 text-lg max-w-lg leading-relaxed">Scan the QR code at your hospital or center to get started with your forms.</p>
          </div>
        </div>

        {/* Active Context Banner */}
        {(context.project || context.site) && (
          <div className="bg-white rounded-2xl border border-emerald-200/60 shadow-sm p-5 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Active Session</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {context.site && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-bold mr-2">{context.site}</span>}
                  {context.project && <span>Project: <strong>{context.project}</strong></span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/forms" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all active:scale-95">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                Continue to Forms
              </Link>
              <button onClick={clearContext} className="text-xs text-slate-400 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50">✕</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Scanner Card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Scan QR Code</h2>
              <p className="text-sm text-slate-500 mb-6">Scan the QR code provided at your hospital or center to access your forms.</p>

              {isScanning ? (
                <div className="flex flex-col items-center">
                  <div id="home-qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl shadow-md mb-4 border border-slate-200"></div>
                  <button type="button" onClick={stopScanning} className="bg-red-50 text-red-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-red-100 transition border border-red-200">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-5 py-4">
                  <div className="w-24 h-24 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <svg className="w-14 h-14 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75H16.5v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75H16.5v-.75z" />
                    </svg>
                  </div>

                  {/* Two scan options */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <button type="button" onClick={startScanning} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3.5 rounded-xl font-bold text-[15px] shadow-lg hover:shadow-xl transition-all active:scale-95 hover:brightness-110 inline-flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
                      Scan with Camera
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white text-slate-700 px-6 py-3.5 rounded-xl font-bold text-[15px] border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all active:scale-95 inline-flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                      Upload QR Image
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  {/* Hidden div for file-based QR scanning */}
                  <div id="home-qr-file-reader" className="hidden"></div>

                  {scanError && <p className="text-red-500 text-sm font-medium text-center">{scanError}</p>}
                  <p className="text-xs text-slate-400 text-center">Use camera to scan live, or upload a saved QR code image from your gallery</p>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Card */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{submissions.length}</p>
                <p className="text-sm text-slate-500 mt-1">Total Submissions</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{todayCount}</p>
                <p className="text-sm text-slate-500 mt-1">Today</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-3 text-sm">Recent Activity</h3>
              {recentSubs.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No submissions yet. Scan a QR to get started.</p>
              ) : (
                <div className="space-y-2">
                  {recentSubs.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Submission #{sub.id}</p>
                        <p className="text-xs text-slate-400">{new Date(sub.submitted_at).toLocaleString()}</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">Done</span>
                    </div>
                  ))}
                </div>
              )}
              {submissions.length > 3 && (
                <Link to="/history" className="block text-center text-sm text-emerald-600 font-semibold mt-3 hover:underline">View all →</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-emerald-100/60 bg-white/40 backdrop-blur-sm mt-16">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-slate-400">
          <span>HaloHealthForms Patient Portal</span>
          <span>Your data is secure & confidential</span>
        </div>
      </div>
    </div>
  );
}
