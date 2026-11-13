/**
 * Unified Microservices Client for Arca Halo Admin Console.
 * Directly communicates with backend microservices across ports 8001, 8004, 8005, and 8000.
 */

const RBAC_URL = import.meta.env.VITE_RBAC_SERVICE_URL || 'http://localhost:8001';
const LOGS_URL = import.meta.env.VITE_LOGS_SERVICE_URL || 'http://localhost:8004';
const USER_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8005';
const FORM_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Canonical service token signed with the shared JWT secret for cluster microservice access
const DEFAULT_SERVICE_TOKEN =
  import.meta.env.VITE_INTERNAL_SERVICE_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdXBlcmFkbWluIiwidXNlcl9pZCI6InN1cGVyYWRtaW4iLCJlbWFpbCI6ImFkbWluQGFyY2FhaS5jb20iLCJyb2xlcyI6WyJTdXBlckFkbWluIiwiQWRtaW4iXSwicGVybWlzc2lvbnMiOlsidXNlcnM6Y3JlYXRlIiwidXNlcnM6dmlldyIsInVzZXJzOmRlbGV0ZSIsInJiYWM6bWFuYWdlIiwiZGFzaGJvYXJkOnZpZXciLCJsb2dzOnZpZXciLCJmb3JtczpjcmVhdGUiLCJmb3Jtczp2aWV3Il0sImlhdCI6MTc5NDU1MTM2OSwiZXhwIjoyMTA5OTExMzY5fQ.FRRo4VRbCTGq2P02eUqNG21Z7EwvDCeGiCz1he-BS64';

async function request(url, options = {}) {
  const token =
    localStorage.getItem('halo_auth_token') ||
    sessionStorage.getItem('halo_auth_token') ||
    DEFAULT_SERVICE_TOKEN;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${errText || response.statusText}`);
    }
    if (response.status === 204) return true;
    return await response.json();
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err.message);
    throw err;
  }
}

export const adminConsoleApi = {
  // ─── System Health & Status ───
  getSystemHealth: async () => {
    const services = [
      { id: 'rbac', name: 'RBAC Service', port: 8001, url: `${RBAC_URL}/health` },
      { id: 'logs', name: 'Logs Service', port: 8004, url: `${LOGS_URL}/health` },
      { id: 'user', name: 'User Service', port: 8005, url: `${USER_URL}/health` },
      { id: 'form', name: 'Form Engine', port: 8000, url: `${FORM_URL}/admin/forms` },
    ];
    return Promise.all(
      services.map(async (svc) => {
        const start = performance.now();
        try {
          const res = await fetch(svc.url);
          const latency = Math.round(performance.now() - start);
          return { ...svc, status: res.ok ? 'Online' : 'Offline', latency };
        } catch {
          return { ...svc, status: 'Offline', latency: null };
        }
      })
    );
  },

  // ─── User Onboarding & Management (:8005) ───
  getUsers: (params = {}) => request(`${USER_URL}/?${new URLSearchParams(params)}`),
  getDemographics: () => request(`${USER_URL}/demographics/`),
  createUser: (data) =>
    request(`${USER_URL}/registerUser`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch((err) => {
      console.warn('Keycloak registration error, falling back to direct db create:', err.message);
      return request(`${USER_URL}/`, { method: 'POST', body: JSON.stringify(data) });
    }),
  updateUser: (userId, data) => request(`${USER_URL}/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (userId) => request(`${USER_URL}/${userId}`, { method: 'DELETE' }),
  getUserSupervisor: (userId) => request(`${USER_URL}/${userId}/supervisor`).catch(() => null),

  // ─── RBAC & Role Management (:8001) ───
  getRoles: () => request(`${RBAC_URL}/roles`),
  getPermissions: (pageSize = 100) => request(`${RBAC_URL}/permissions?page_size=${pageSize}`),
  getUserRoles: (userId) => request(`${RBAC_URL}/users/${userId}/roles`),
  assignUserRole: (userId, roleName) => request(`${RBAC_URL}/users/${userId}/roles/${roleName}`, { method: 'POST' }),
  revokeUserRole: (userId, roleName) => request(`${RBAC_URL}/users/${userId}/roles/${roleName}`, { method: 'DELETE' }),
  createRole: (data) => request(`${RBAC_URL}/roles`, { method: 'POST', body: JSON.stringify(data) }),
  updateRolePermissions: (roleId, permissionIds) =>
    request(`${RBAC_URL}/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permission_ids: permissionIds }),
    }),

  // ─── Logs & Telemetry (:8004) ───
  getServiceLogs: (serviceName, limit = 100) => request(`${LOGS_URL}/logs/${serviceName}?limit=${limit}`).catch(() => []),
  getContainerStats: () => request(`${LOGS_URL}/containers/stats`).catch(() => null),
};

