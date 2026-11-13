import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Clinical Studies Pages
import { ProjectList } from './pages/ProjectList';
import { ProjectDashboard } from './pages/ProjectDashboard';
import { HospitalManager } from './pages/HospitalManager';
import { Dashboard } from './pages/Dashboard';
import { FormBuilder } from './pages/FormBuilder';
import { Responses } from './pages/Responses';

// Merged Arca Halo Admin Console Pages
import { ConsoleLayout } from './pages/console/ConsoleLayout';
import { ConsoleDashboard } from './pages/console/ConsoleDashboard';
import { UserManagerPage } from './pages/console/UserManagerPage';
import { RoleManagerPage } from './pages/console/RoleManagerPage';
import { LogsViewerPage } from './pages/console/LogsViewerPage';

// Login Page
import { LoginPage } from './pages/LoginPage';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          {/* ─── PUBLIC AUTHENTICATION ROUTE ─── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ─── PROTECTED CLINICAL STUDY ROUTES ─── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProjectList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/hospitals"
            element={
              <ProtectedRoute>
                <HospitalManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/builder/:id"
            element={
              <ProtectedRoute>
                <FormBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/responses/:id"
            element={
              <ProtectedRoute>
                <Responses />
              </ProtectedRoute>
            }
          />

          {/* ─── PROTECTED ARCA HALO ADMIN CONSOLE ROUTES ─── */}
          <Route
            path="/console"
            element={
              <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Doctor', 'Hospital Doctor']}>
                <ConsoleLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ConsoleDashboard />} />
            <Route path="users" element={<UserManagerPage />} />
            <Route path="rbac" element={<RoleManagerPage />} />
            <Route path="logs" element={<LogsViewerPage />} />
          </Route>

          {/* LEGACY — Backward compatibility */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder/:id"
            element={
              <ProtectedRoute>
                <FormBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/responses/:id"
            element={
              <ProtectedRoute>
                <Responses />
              </ProtectedRoute>
            }
          />

          {/* CATCH-ALL REDIRECT */}
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
