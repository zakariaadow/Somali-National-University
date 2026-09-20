import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const CollegeReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('enrollment');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'College Officer') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      params.append('format', 'json');

      const response = await axios.get(`${API_BASE_URL}/reports/${reportType}?${params}`, {
        withCredentials: true
      });
      setReportData(response.data);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.response?.data?.error || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      params.append('format', 'csv');

      window.open(`${API_BASE_URL}/reports/${reportType}?${params}`, '_blank');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV.');
    }
  };

  const reportTypes = [
    { value: 'enrollment', label: 'Enrollment Report' },
    { value: 'academic-performance', label: 'Academic Performance' },
    { value: 'registration', label: 'Registration Report' },
    { value: 'student-card', label: 'Student Card Report' },
    { value: 'graduation', label: 'Graduation Report' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and export college reports</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            {reportData && (
              <button
                onClick={exportCSV}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Export CSV
              </button>
            )}
          </div>
        </div>

        {reportData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {reportData.report_type || 'Report Results'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Object.entries(reportData).map(([key, value]) => {
                if (typeof value !== 'object' || value === null) {
                  return (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-lg font-semibold text-gray-900">{String(value)}</p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeReports;