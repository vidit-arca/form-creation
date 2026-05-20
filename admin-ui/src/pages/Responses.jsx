import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api';

export function Responses() {
  const { id, projectId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/admin/forms/${id}/submissions`)
      .then(res => res.json())
      .then(data => {
        setSubmissions(data);
        setLoading(false);
      });
  }, [id]);

  const handleExport = () => {
    window.location.href = `${API_URL}/admin/forms/${id}/export`;
  };

  // Context-aware back link
  const backLink = projectId ? `/projects/${projectId}` : '/dashboard';
  const backLabel = projectId ? '← Back to Project' : '← Back to Dashboard';

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  // Collect data field headers
  const headers = new Set();
  submissions.forEach(sub => {
    Object.keys(sub.data).forEach(k => headers.add(k));
  });
  const headerList = Array.from(headers);

  // Check if any submissions have metadata
  const hasMetadata = submissions.some(s => s.hospital_id || s.center_id || s.submitted_by);

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <Link to={backLink} className="text-gray-500 hover:text-gray-800 mb-6 inline-block">{backLabel}</Link>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Form Responses</h1>
          <p className="text-gray-500 text-sm mt-1">Form ID: {id} | Total Submissions: {submissions.length}</p>
        </div>
        <button onClick={handleExport} className="bg-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-green-700 transition font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-x-auto border border-gray-200">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs">Sub ID</th>
              <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs">Patient ID</th>
              <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs">Submitted At</th>
              {/* NEW — Metadata columns (only shown if data exists) */}
              {hasMetadata && (
                <>
                  <th className="p-4 font-bold text-indigo-700 uppercase tracking-wider text-xs bg-indigo-50/50">Hospital</th>
                  <th className="p-4 font-bold text-indigo-700 uppercase tracking-wider text-xs bg-indigo-50/50">Center</th>
                  <th className="p-4 font-bold text-indigo-700 uppercase tracking-wider text-xs bg-indigo-50/50">Submitted By</th>
                </>
              )}
              {headerList.map(h => (
                <th key={h} className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.map(sub => (
              <tr key={sub.id} className="hover:bg-gray-50 transition">
                <td className="p-4 text-gray-600">#{sub.id}</td>
                <td className="p-4 text-gray-600">{sub.patient_id}</td>
                <td className="p-4 text-gray-500">{new Date(sub.submitted_at).toLocaleString()}</td>
                {hasMetadata && (
                  <>
                    <td className="p-4 bg-indigo-50/30">
                      {sub.hospital_id ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          ID: {sub.hospital_id}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="p-4 bg-indigo-50/30 text-gray-600">{sub.center_id || <span className="text-gray-300">—</span>}</td>
                    <td className="p-4 bg-indigo-50/30 text-gray-600">{sub.submitted_by || <span className="text-gray-300">—</span>}</td>
                  </>
                )}
                {headerList.map(h => (
                  <td key={h} className="p-4 font-medium text-gray-800">{sub.data[h]?.toString() || '-'}</td>
                ))}
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={3 + (hasMetadata ? 3 : 0) + headerList.length} className="p-12 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  No responses received yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
