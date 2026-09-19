import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const AdminReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('enrollment');
  const [format, setFormat] = useState('json');

  React.useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'Admin') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/reports/${reportType}?format=${format}`, {
        withCredentials: true
      });
      setReportData(response.data);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/${reportType}?format=csv`, {
        withCredentials: true,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and export system reports</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Controls */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="enrollment">Enrollment Report</option>
                  <option value="financial">Financial Report</option>
                  <option value="academic-performance">Academic Performance Report</option>
                  <option value="student-card">Student Card Report</option>
                  <option value="registration">Registration Report</option>
                  <option value="attendance">Attendance Report</option>
                  <option value="exam-card">Exam Card Report</option>
                  <option value="graduation">Graduation Report</option>
                  <option value="fee-structure">Fee Structure Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              <button
                onClick={generateReport}
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {/* Report Preview */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Report Preview</h2>
              {reportData && (
                <button
                  onClick={downloadReport}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
                >
                  📥 Download CSV
                </button>
              )}
            </div>
            {reportData ? (
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(reportData, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Select a report type and click "Generate Report"</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">8</p>
            <p className="text-sm text-gray-500">Colleges</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">24</p>
            <p className="text-sm text-gray-500">Programmes</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">160</p>
            <p className="text-sm text-gray-500">Units</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">100+</p>
            <p className="text-sm text-gray-500">Students</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;