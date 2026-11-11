import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Building2,
  Plus,
  ArrowLeft,
  Trash2,
  Download,
  Copy,
  Hash,
  X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function HospitalManager() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [siteCode, setSiteCode] = useState('');
  const [address, setAddress] = useState('');

  // Patient portal base URL
  const PATIENT_BASE = import.meta.env.VITE_PATIENT_URL || 'http://localhost:5174';

  const fetchData = () => {
    Promise.all([
      fetch(`${API_URL}/admin/projects/${projectId}`).then((r) => r.json()),
      fetch(`${API_URL}/admin/projects/${projectId}/hospitals`).then((r) => r.json()),
    ])
      .then(([proj, hosps]) => {
        setProject(proj);
        setHospitals(Array.isArray(hosps) ? hosps : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleNameChange = (val) => {
    setName(val);
    if (!siteCode || siteCode.length <= 3) {
      setSiteCode(
        val
          .toUpperCase()
          .replace(/[^A-Z]/g, '')
          .slice(0, 3)
      );
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !siteCode.trim()) return;
    try {
      const res = await fetch(`${API_URL}/admin/projects/${projectId}/hospitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, site_code: siteCode, address }),
      });
      if (res.ok) {
        setShowModal(false);
        setName('');
        setSiteCode('');
        setAddress('');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.detail || 'Site mapping failed.');
      }
    } catch {
      alert('Could not connect to backend server.');
    }
  };

  const handleRemove = async (hospitalId, hospitalName) => {
    if (!confirm(`Deactivate "${hospitalName}" from this study project?`)) return;
    await fetch(`${API_URL}/admin/projects/${projectId}/hospitals/${hospitalId}`, {
      method: 'DELETE',
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-xs text-blue-800">
        <span className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3 mr-3" />
        <span>RETRIEVING SITE PARTICIPANTS...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen radiant-canvas text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col relative overflow-hidden">
      {/* ─── Top Clinical Navigation Bar ─── */}
      <header className="radiant-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-sm tracking-wide shadow-sm shadow-blue-700/25 ring-1 ring-white/30">
                HF
              </div>
              <span className="font-bold text-base tracking-tight text-slate-950 hidden sm:inline">
                Halo<span className="text-blue-600">Form</span>Craft
              </span>
            </Link>

            <span className="text-slate-300 text-sm">/</span>
            <Link
              to={`/projects/${projectId}`}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition font-mono truncate max-w-[150px]"
            >
              {project?.name}
            </Link>
            <span className="text-slate-300 text-sm">/</span>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/70 uppercase">
              Participating Sites
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
            AD
          </div>
        </div>
      </header>

      {/* ─── Main Content Surface ─── */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header Block */}
        <section className="pb-6 border-b border-slate-200/80 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Link
              to={`/projects/${projectId}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-3 font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>RETURN TO {project?.name?.toUpperCase()}</span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Participating Hospitals &amp; Field Centers
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Map clinical institutions and assign unique 3-letter site codes for cohort partition.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition active:translate-y-[1px] shadow-sm shadow-blue-600/20 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Map New Hospital Site</span>
          </button>
        </section>

        {/* Site List Ledger */}
        <section>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide font-mono">
              Mapped Institutions ({hospitals.length})
            </h2>
          </div>

          {hospitals.length === 0 ? (
            <div className="radiant-card rounded-xl p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3 stroke-[1.25]" />
              <h3 className="text-sm font-bold text-slate-800">No medical sites mapped yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Add participating hospitals or field clinics to generate site-specific QR routing codes.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {hospitals.map((hospital) => {
                const qrUrl = `${PATIENT_BASE}/?project=${project?.slug}&site=${hospital.site_code}`;
                const qrId = `qr-${hospital.site_code}`;

                return (
                  <div
                    key={hospital.id}
                    className="radiant-card rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-blue-300 hover:shadow-xs transition"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Interactive QR Preview Card */}
                      <div
                        id={qrId}
                        className="bg-white p-2 rounded-lg border border-slate-200 shrink-0 shadow-2xs"
                      >
                        <QRCodeSVG value={qrUrl} size={84} level="H" includeMargin={true} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-slate-950">{hospital.name}</h3>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/80">
                            SITE: {hospital.site_code}
                          </span>
                        </div>

                        {hospital.address && (
                          <p className="text-xs text-slate-500 mt-1">{hospital.address}</p>
                        )}

                        <div className="mt-2.5">
                          <code className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded inline-block font-mono max-w-md truncate">
                            {qrUrl}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Site Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => {
                          const svg = document.querySelector(`#${qrId} svg`);
                          if (!svg) return;
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          const svgData = new XMLSerializer().serializeToString(svg);
                          const img = new Image();
                          img.onload = () => {
                            canvas.width = img.width * 2;
                            canvas.height = img.height * 2;
                            ctx.fillStyle = 'white';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            const link = document.createElement('a');
                            link.download = `QR_${project?.slug}_${hospital.site_code}.png`;
                            link.href = canvas.toDataURL('image/png');
                            link.click();
                          };
                          img.src =
                            'data:image/svg+xml;base64,' +
                            btoa(unescape(encodeURIComponent(svgData)));
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition"
                        title="Download QR code image"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>PNG</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(qrUrl);
                          alert('Station URL copied to clipboard.');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition"
                        title="Copy direct intake link"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </button>

                      <button
                        onClick={() => handleRemove(hospital.id, hospital.name)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
                        title="Deactivate Site"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ─── Modal: Map Hospital ─── */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="map-site-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 sm:p-7 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="map-site-title" className="text-base font-bold text-slate-950">
                    Map New Participating Site
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add clinical institution and generate permanent station QR code.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close site mapping dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hospital / Institution Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. All India Institute of Medical Sciences (AIIMS)"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  3-Letter Site Code *
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={siteCode}
                    onChange={(e) =>
                      setSiteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))
                    }
                    placeholder="e.g. DEL"
                    maxLength={5}
                    className="w-full border border-slate-300 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-slate-900 font-mono font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Embedded into participant QR codes for automatic multi-center indexing.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Physical Address / Department Notes
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Cardiology OPD, Ansari Nagar, New Delhi"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition active:translate-y-[1px] shadow-sm shadow-blue-600/20"
                >
                  Register Site Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
