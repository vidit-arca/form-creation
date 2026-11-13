import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEV_ROLE_PRESETS } from '../context/AuthContext';
import {
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Server
} from 'lucide-react';

export function LoginPage() {
  const { loginWithKeycloak, loginWithPreset, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('credentials'); // 'credentials' | 'dev_presets'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setErrorMsg('');
    try {
      await loginWithKeycloak(username.trim(), password.trim());
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handlePresetLogin = (presetKey) => {
    loginWithPreset(presetKey);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen radiant-canvas text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      
      {/* ─── Top Brand Bar ─── */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-xs tracking-wide shadow-sm shadow-blue-700/25">
            HF
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-950">
            Halo<span className="text-blue-600">Form</span><span className="text-slate-700">Craft</span>
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>KEYCLOAK :8080 READY</span>
        </div>
      </header>

      {/* ─── Center Login Card ─── */}
      <main className="flex-1 flex items-center justify-center py-10">
        <div className="radiant-card rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl border border-slate-200/90 space-y-6 relative">
          
          {/* Top Card Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-base tracking-wide shadow-md shadow-blue-600/30 mx-auto">
              HF
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
              Arca Halo Admin Portal
            </h1>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Sign in to manage clinical study protocols, field instruments, and platform access control.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('credentials')}
              className={`py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Keycloak Login
            </button>
            <button
              onClick={() => setActiveTab('dev_presets')}
              className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'dev_presets'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <span>Role Presets</span>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-mono px-1 rounded font-bold">IISc</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ─── Mode 1: Keycloak Direct Login Form ─── */}
          {activeTab === 'credentials' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Username or Clinical Email</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or doctor@iisc.ac.in"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{loading ? 'Authenticating with Keycloak...' : 'Sign In to Platform'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <span className="text-[11px] font-mono text-slate-500">
                  Realm: <strong className="text-slate-700">arca-halo</strong> &bull; Client: <strong className="text-slate-700">arca-halo</strong>
                </span>
              </div>
            </form>
          ) : (
            /* ─── Mode 2: Quick 1-Click Role Presets (For RBAC Validation) ─── */
            <div className="space-y-2 text-xs">
              <p className="text-slate-600 text-[11px] mb-3">
                Select an IISc clinical persona to instantly test role-scoped permissions and page visibility:
              </p>

              {Object.entries(DEV_ROLE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetLogin(key)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left flex items-center justify-between transition group cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{preset.name}</span>
                      <span className="font-mono text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200/60">
                        {preset.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{preset.email}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
                </button>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* ─── Bottom Footer ─── */}
      <footer className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs text-slate-500 font-mono py-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Arca Halo Security &bull; Keycloak 24.x Enforced</span>
        </div>
        <span>IISc RBAC Architecture</span>
      </footer>

    </div>
  );
}

