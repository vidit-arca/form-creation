import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen radiant-canvas flex items-center justify-center text-xs font-mono text-slate-500">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleLower = (user.role || '').toLowerCase();
    const hasRole = allowedRoles.some((r) => r.toLowerCase() === userRoleLower);
    if (!hasRole) {
      return (
        <div className="min-h-screen radiant-canvas flex flex-col items-center justify-center p-6 text-center">
          <div className="radiant-card rounded-2xl p-8 max-w-md w-full space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              !
            </div>
            <h2 className="text-lg font-bold text-slate-950">Access Restricted</h2>
            <p className="text-xs text-slate-600">
              Your current role (<span className="font-semibold text-slate-900">{user.role}</span>) does not have authorization to view this module.
            </p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
            >
              Return to Clinical Studies
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
}

