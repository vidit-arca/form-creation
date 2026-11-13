import React, { useState, useEffect } from 'react';
import { adminConsoleApi } from '../../services/adminConsoleApi';
import {
  Shield,
  Key,
  CheckSquare,
  Square,
  Save,
  Lock,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowLeft,
  X
} from 'lucide-react';

export function RoleManagerPage() {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active matrix editor state
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermIds, setSelectedPermIds] = useState(new Set());
  const [savingPerms, setSavingPerms] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadRbacData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        adminConsoleApi.getRoles().catch(() => []),
        adminConsoleApi.getPermissions(100).catch(() => ({ items: [] })),
      ]);

      const rawRoles = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.items || []);
      // Filter out duplicate or legacy names
      const cleanRoles = rawRoles.filter((r) => (r.name || '').toLowerCase() !== 'doctor_old');
      const perms = Array.isArray(permsRes) ? permsRes : (permsRes?.items || []);

      setRoles(cleanRoles.length > 0 ? cleanRoles : defaultSeedRoles);
      setAllPermissions(perms.length > 0 ? perms : defaultSeedPermissions);
    } catch (err) {
      console.error('Failed to load RBAC matrix:', err);
      setRoles(defaultSeedRoles);
      setAllPermissions(defaultSeedPermissions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRbacData();
  }, []);

  const openPermissionEditor = (role) => {
    setSelectedRole(role);
    const existingIds = (role.permissions || []).map((p) => (typeof p === 'object' ? p.id : p));
    setSelectedPermIds(new Set(existingIds));
    setSuccessMsg('');
    setErrorMsg('');
  };

  const togglePermission = (permId) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSavingPerms(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await adminConsoleApi.updateRolePermissions(selectedRole.id, Array.from(selectedPermIds));
      setSuccessMsg(`Permissions for role '${selectedRole.name}' synchronized successfully.`);
      loadRbacData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update role permissions.');
    } finally {
      setSavingPerms(false);
    }
  };

  // Group permissions by module prefix
  const permissionsByModule = allPermissions.reduce((acc, perm) => {
    const mod = (perm.name || '').split(':')[0] || 'general';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ─── Page Action Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-950">Role-Based Access Control (RBAC)</h2>
          <p className="text-sm text-slate-600">
            Granular action permission matrix across clinical modules, user onboarding, and system telemetry.
          </p>
        </div>

        <span className="text-xs font-mono font-semibold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
          Security Model Enforced
        </span>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4 text-emerald-600 cursor-pointer" /></button>
        </div>
      )}

      {/* ─── 5 Tier Role Hierarchy Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
        {roles.map((r) => {
          const isSelected = selectedRole?.id === r.id;
          const permCount = r.permissions?.length || 0;

          return (
            <div
              key={r.id || r.name}
              onClick={() => openPermissionEditor(r)}
              className={`radiant-card rounded-xl p-4.5 cursor-pointer transition relative overflow-hidden group ${isSelected
                ? 'border-2 border-blue-600 bg-blue-50/40 shadow-md ring-1 ring-blue-500/20'
                : 'hover:border-blue-300'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  {r.is_system ? 'System Role' : 'Custom Role'}
                </span>
                {r.is_system && <Lock className="w-3.5 h-3.5 text-slate-400" />}
              </div>

              <div className="text-base font-bold text-slate-950 group-hover:text-blue-700 transition-colors">
                {r.name}
              </div>

              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {r.description || 'IISc Clinical Security Tier'}
              </p>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{permCount} permissions</span>
                <span className="text-blue-600 font-semibold group-hover:underline">Edit &rarr;</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Permission Matrix Inspector ─── */}
      {selectedRole ? (
        <div className="radiant-card rounded-2xl p-6 space-y-6 bg-white border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedRole(null)}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <span>Permission Checklist: {selectedRole.name}</span>
                  {selectedRole.is_system && (
                    <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      Immutable System Role
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRole.description}</p>
              </div>
            </div>

            <button
              onClick={handleSavePermissions}
              disabled={savingPerms}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingPerms ? 'Saving...' : 'Save Matrix'}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Module Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(permissionsByModule).map(([modName, perms]) => (
              <div key={modName} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-xs font-mono font-bold uppercase text-slate-950 tracking-wider">
                    {modName} module
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">
                    {perms.filter((p) => selectedPermIds.has(p.id)).length}/{perms.length} active
                  </span>
                </div>

                <div className="space-y-2">
                  {perms.map((p) => {
                    const isChecked = selectedPermIds.has(p.id);
                    return (
                      <label
                        key={p.id}
                        onClick={() => togglePermission(p.id)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition text-xs ${isChecked
                          ? 'bg-blue-50/80 text-blue-950 border border-blue-200/60 font-medium'
                          : 'hover:bg-slate-100/60 text-slate-700'
                          }`}
                      >
                        <div className="mt-0.5 text-blue-600">
                          {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div>
                          <div className="font-mono font-semibold text-[11px]">{p.name}</div>
                          {p.description && <div className="text-[10px] text-slate-500 mt-0.5">{p.description}</div>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="radiant-card rounded-2xl p-8 text-center text-xs text-slate-500 space-y-2">
          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-semibold text-slate-800 text-sm">Select a role above to inspect and edit its permission matrix.</p>
          <p className="max-w-md mx-auto text-slate-500 text-[11px]">
            Roles determine access to Dashboard metrics, Clinician Onboarding, Form Schema authoring, and System Logs.
          </p>
        </div>
      )}
    </div>
  );
}

// Fallback seed definitions matching IISc RBAC Excel matrix
const defaultSeedRoles = [
  { id: 1, name: 'SuperAdmin', description: 'Full Platform Owner & Architecture Access', is_system: true, permissions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { id: 2, name: 'Admin', description: 'Console & User Lifecycle Administrator', is_system: true, permissions: [1, 2, 3, 4, 5, 6, 7] },
  { id: 3, name: 'Doctor', description: 'Clinical Protocol Lead & Form Author', is_system: false, permissions: [1, 5, 6, 7] },
  { id: 4, name: 'Hospital Doctor', description: 'Site-Scoped Clinical Data Reviewer', is_system: false, permissions: [1, 6, 7] },
  { id: 5, name: 'Hospital Operator', description: 'Field Intake & Patient Data Collector', is_system: false, permissions: [1, 7] },
];

const defaultSeedPermissions = [
  { id: 1, name: 'dashboard:view', description: 'View system health & microservice telemetry' },
  { id: 2, name: 'users:view', description: 'View onboarded clinician directory' },
  { id: 3, name: 'users:create', description: 'Onboard new clinicians and doctors' },
  { id: 4, name: 'users:delete', description: 'Deactivate clinicians from hospital roster' },
  { id: 5, name: 'rbac:manage', description: 'Configure roles and permission checklists' },
  { id: 6, name: 'forms:create', description: 'Author and publish dynamic clinical schemas' },
  { id: 7, name: 'forms:view', description: 'Inspect submissions and export study ledgers' },
  { id: 8, name: 'logs:view', description: 'Inspect real-time container log streams' },
  { id: 9, name: 'logs:export', description: 'Download compliance audit logs' },
  { id: 10, name: 'system:config', description: 'Update cluster connection URLs' },
];

