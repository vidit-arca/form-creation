import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProjectList } from './pages/ProjectList';
import { ProjectDashboard } from './pages/ProjectDashboard';
import { HospitalManager } from './pages/HospitalManager';
import { Dashboard } from './pages/Dashboard';
import { FormBuilder } from './pages/FormBuilder';
import { Responses } from './pages/Responses';

function App() {
  return (
    <Router>
      <Routes>
        {/* NEW — Project management pages (upstream of form flow) */}
        <Route path="/" element={<ProjectList />} />
        <Route path="/projects/:projectId" element={<ProjectDashboard />} />
        <Route path="/projects/:projectId/hospitals" element={<HospitalManager />} />

        {/* EXISTING — Form routes, now nested under project context */}
        {/* FormBuilder and Responses components are IDENTICAL internally */}
        <Route path="/projects/:projectId/builder/:id" element={<FormBuilder />} />
        <Route path="/projects/:projectId/responses/:id" element={<Responses />} />

        {/* LEGACY — Keep old routes working for backward compatibility */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/builder/:id" element={<FormBuilder />} />
        <Route path="/responses/:id" element={<Responses />} />
      </Routes>
    </Router>
  );
}

export default App;
