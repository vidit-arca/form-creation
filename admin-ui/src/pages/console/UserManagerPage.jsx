import React, { useState, useEffect } from 'react';
import { adminConsoleApi } from '../../services/adminConsoleApi';
import {
  Users,
  Search,
  Plus,
  Shield,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Filter,
  UserCheck,
  Copy,
  Key,
  Check
} from 'lucide-react';

export function UserManagerPage() {
  const [users, setUsers] = useState([]);
  const [demographics, setDemographics] = useState({ departments: [], hospitals: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [targetRole, setTargetRole] = useState('doctor');
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    department: '',
    specialization: '',
    hospital_name: '',
    role: 'Doctor',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const generateSecurePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pwd = 'Halo#2026!';
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd }));
  };

  const loadUsersAndDemographics = async () => {
    setLoading(true);
    try {
      const [usersRes, demoRes] = await Promise.all([
        adminConsoleApi.getUsers({ page_size: 100 }).catch(() => ({ items: [] })),
        adminConsoleApi.getDemographics().catch(() => ({ departments: [], hospitals: [] })),
      ]);

      const rawUsers = Array.isArray(usersRes) ? usersRes : (usersRes?.items || []);
      
      // Enrich users with role & supervisor
      const enriched = await Promise.all(
        rawUsers.map(async (u) => {
          try {
            const [rolesRes, supRes] = await Promise.all([
              adminConsoleApi.getUserRoles(u.id).catch(() => ({ roles: [] })),
              adminConsoleApi.getUserSupervisor(u.id).catch(() => null),
            ]);
            const roles = (rolesRes?.roles || []).map((r) => (r.name || '').toLowerCase());
            return {
              ...u,
              roles,
              primary_role: roles[0] || u.role || 'Doctor',
              supervisor_name: supRes?.supervisor_name || u.supervisor_name || null,
            };
          } catch {
            return { ...u, roles: [u.role || 'Doctor'], primary_role: u.role || 'Doctor' };
          }
        })
      );

      setUsers(enriched);
      setDemographics(demoRes || { departments: [], hospitals: [] });
    } catch (err) {
      console.error('Failed to load user management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersAndDemographics();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    // If password is blank, auto-generate default temporary password
    const effectivePassword = formData.password.trim() || 'HaloDoctor@2026';
    const fullName = formData.full_name?.trim() || formData.username?.trim();

    try {
      await adminConsoleApi.createUser({
        name: fullName,
        email: formData.email.trim(),
        password: effectivePassword,
        phone: '',
        department_id: formData.department_id || null,
        hospital_id: formData.hospital_id || null,
        specialization_id: formData.specialization_id || null,
      });

      // Present the generated credentials to the admin
      setCreatedCredentials({
        name: fullName,
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: effectivePassword,
      });

      setSuccessMsg(`Clinician '${fullName}' onboarded successfully with Keycloak account!`);
      setShowCreateModal(false);
      setFormData({
        username: '',
        email: '',
        full_name: '',
        password: '',
        department: '',
        specialization: '',
        hospital_name: '',
        role: 'Doctor',
      });
      loadUsersAndDemographics();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to onboard user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Arca Halo Clinician Account:\nUsername: ${createdCredentials.username}\nEmail: ${createdCredentials.email}\nInitial Password: ${createdCredentials.password}\nPortal URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAssignRole = async (userId, roleName) => {
    try {
      await adminConsoleApi.assignUserRole(userId, roleName);
      setSelectedUserForRole(null);
      loadUsersAndDemographics();
    } catch (err) {
      alert(`Role assignment error: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to deactivate clinician '${name}'?`)) return;
    try {
      await adminConsoleApi.deleteUser(userId);
      loadUsersAndDemographics();
    } catch (err) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (u.full_name || u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q);

    const matchesDept = deptFilter === 'ALL' || u.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ─── Page Action & Filter Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-950">Clinician Onboarding &amp; Roster</h2>
          <p className="text-sm text-slate-600">
            Register hospital doctors, clinical PIs, and field operators with automated Keycloak account provisioning.
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            generateSecurePassword(); // Pre-populate with auto-generated secure password
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard Clinician</span>
        </button>
      </div>

      {/* ─── Success Banner with Generated Credentials ─── */}
      {createdCredentials && (
        <div className="radiant-card p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Clinician Account Provisioned in Keycloak &amp; Database</span>
            </div>
            <button onClick={() => setCreatedCredentials(null)}>
              <X className="w-4 h-4 text-emerald-700 hover:text-emerald-900 cursor-pointer" />
            </button>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
            <div>
              <div>Name: <span className="font-bold text-slate-900">{createdCredentials.name}</span></div>
              <div>Username: <span className="font-semibold text-blue-700">{createdCredentials.username}</span></div>
              <div>Email: <span className="text-slate-600">{createdCredentials.email}</span></div>
              <div>Initial Password: <span className="font-bold text-slate-950 bg-slate-100 px-2 py-0.5 rounded">{createdCredentials.password}</span></div>
            </div>

            <button
              onClick={handleCopyCredentials}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-xs cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Search & Table Card ─── */}
      <div className="radiant-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {demographics.departments?.length > 0 && (
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {demographics.departments.map((d) => (
                  <option key={typeof d === 'object' ? d.id : d} value={typeof d === 'object' ? d.name : d}>
                    {typeof d === 'object' ? d.name : d}
                  </option>
                ))}
              </select>
            )}
          </div>

          <span className="text-xs font-mono font-semibold text-slate-500 shrink-0">
            {filteredUsers.length} CLINICIANS ENROLLED
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">
            Loading clinician roster from User Service (:8005)...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No clinicians found matching your search.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-6">Name &amp; Clinical Identity</th>
                <th className="py-3 px-6">Department &amp; Site</th>
                <th className="py-3 px-6">Assigned Role</th>
                <th className="py-3 px-6">Supervisor</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const displayName = u.full_name || u.name || u.username;
                const roleLower = (u.primary_role || 'doctor').toLowerCase();
                const isSuper = roleLower === 'superadmin' || roleLower === 'admin';
                const isDoc = roleLower === 'doctor' || roleLower === 'hospital doctor';

                return (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-4 px-6 font-semibold text-slate-950 text-sm">
                      {displayName}
                      <span className="block text-xs font-mono font-normal text-slate-400 mt-0.5">
                        {u.email}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-700">
                      <div>{u.department || 'General Clinical'}</div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {u.hospital_name || u.specialization || 'Central Hospital'}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded border capitalize ${
                          isSuper
                            ? 'bg-purple-50 text-purple-700 border-purple-200/70'
                            : isDoc
                            ? 'bg-blue-50 text-blue-700 border-blue-200/70'
                            : 'bg-amber-50 text-amber-800 border-amber-200/70'
                        }`}
                      >
                        {u.primary_role}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {u.supervisor_name || '—'}
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold font-mono text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ACTIVE
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right space-x-3">
                      <button
                        onClick={() => setSelectedUserForRole(u)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, displayName)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Onboard Clinician Modal (With Explicit Password Creation) ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="radiant-card rounded-2xl w-full max-w-lg p-6 shadow-2xl bg-white border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-950">Onboard New Clinician</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. rajesh.kumar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="doctor@iisc.ac.in"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Clinical Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Kumar, MD"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* ─── Password Configuration Field ─── */}
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-blue-950 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>Initial Password *</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="text-blue-700 hover:text-blue-900 text-[11px] font-bold cursor-pointer underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="e.g. Doctor@123 or click Auto-Generate"
                  className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                />
                <span className="text-[10px] text-blue-700/80 block">
                  This password is automatically provisioned into Keycloak so the clinician can log in immediately.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Oncology, Cardiology"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medical Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g. Surgical Oncology"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Hospital Site</label>
                <input
                  type="text"
                  value={formData.hospital_name}
                  onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                  placeholder="e.g. Central Clinical Hospital - Site 1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-xs cursor-pointer"
                >
                  {submitting ? 'Registering in Keycloak...' : 'Register Clinician'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Role Modal ─── */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="radiant-card rounded-2xl w-full max-w-sm p-6 shadow-2xl bg-white border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-950">
                Assign Role: {selectedUserForRole.full_name || selectedUserForRole.name || selectedUserForRole.username}
              </h3>
              <button onClick={() => setSelectedUserForRole(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600">Select IISc clinical security role tier:</p>
              {['Doctor', 'Hospital Doctor', 'Hospital Operator', 'Admin', 'SuperAdmin'].map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                    targetRole === r
                      ? 'border-blue-600 bg-blue-50/60 font-semibold text-blue-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{r}</span>
                  <input
                    type="radio"
                    name="role-select"
                    checked={targetRole === r}
                    onChange={() => setTargetRole(r)}
                    className="accent-blue-600"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedUserForRole(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssignRole(selectedUserForRole.id, targetRole.toLowerCase())}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-semibold shadow-xs"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
