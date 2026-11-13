import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'arca-halo';
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'arca-halo';
const CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'ihdp5bhmgBsd1kWEYeyJxHeDrf7ln5ji';

// Helper to decode JWT payload safely in vanilla JS
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// 5 IISc Role Presets for local dev & instant testing
export const DEV_ROLE_PRESETS = {
  superadmin: {
    username: 'superadmin',
    name: 'SuperAdmin Owner',
    email: 'superadmin@iisc.ac.in',
    role: 'SuperAdmin',
    roles: ['SuperAdmin', 'Admin'],
    permissions: ['*'],
  },
  admin: {
    username: 'admin',
    name: 'Console Administrator',
    email: 'admin@arcaai.com',
    role: 'Admin',
    roles: ['Admin'],
    permissions: ['dashboard:view', 'users:view', 'users:create', 'users:delete', 'rbac:manage', 'logs:view', 'forms:view'],
  },
  doctor: {
    username: 'doctor.rajesh',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.k@iisc.ac.in',
    role: 'Doctor',
    roles: ['Doctor'],
    permissions: ['dashboard:view', 'forms:create', 'forms:view'],
  },
  hospital_doctor: {
    username: 'dr.ananya',
    name: 'Dr. Ananya Sen',
    email: 'ananya.s@hospital.org',
    role: 'Hospital Doctor',
    roles: ['Hospital Doctor'],
    permissions: ['dashboard:view', 'forms:view'],
  },
  hospital_operator: {
    username: 'pooja.operator',
    name: 'Pooja Sharma',
    email: 'pooja.s@hospital.org',
    role: 'Hospital Operator',
    roles: ['Hospital Operator'],
    permissions: ['forms:view'],
  },
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('halo_auth_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('halo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return DEV_ROLE_PRESETS.superadmin; // Default initial session for dev
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('halo_auth_token', token);
    } else {
      localStorage.removeItem('halo_auth_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('halo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('halo_user');
    }
  }, [user]);

  // Authenticate with Keycloak OAuth2 direct access grant
  const loginWithKeycloak = async (username, password) => {
    setLoading(true);
    try {
      const endpoint = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username,
        password,
      });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error_description || 'Invalid credentials with Keycloak');
      }

      const data = await res.json();
      const accessToken = data.access_token;
      const decoded = parseJwt(accessToken) || {};

      const realmRoles = decoded.realm_access?.roles || [];
      const primaryRole =
        realmRoles.find((r) => ['superadmin', 'admin', 'doctor', 'hospital_doctor', 'hospital_operator'].includes(r.toLowerCase())) ||
        'Doctor';

      const userProfile = {
        username: decoded.preferred_username || username,
        name: decoded.name || username,
        email: decoded.email || `${username}@arcaai.com`,
        role: primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1),
        roles: realmRoles,
        permissions: decoded.permissions || [],
      };

      setToken(accessToken);
      setUser(userProfile);
      return userProfile;
    } finally {
      setLoading(false);
    }
  };

  // Instant Persona Login (for developer RBAC matrix validation)
  const loginWithPreset = (presetKey) => {
    const profile = DEV_ROLE_PRESETS[presetKey] || DEV_ROLE_PRESETS.superadmin;
    const fallbackToken = import.meta.env.VITE_INTERNAL_SERVICE_TOKEN || 'dev-token';
    setToken(fallbackToken);
    setUser(profile);
    return profile;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('halo_auth_token');
    localStorage.removeItem('halo_user');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!user,
        loading,
        loginWithKeycloak,
        loginWithPreset,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

