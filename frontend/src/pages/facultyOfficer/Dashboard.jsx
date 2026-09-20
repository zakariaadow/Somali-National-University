import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const FacultyOfficerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    statistics: {},
    pending_cards: [],
    recent_activities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));

    const role = localStorage.getItem('role');
    if (role !== 'Faculty Officer') {
      navigate('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/faculty-officer/dashboard`, {
          withCredentials: true
        });
        setDashboardData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load dashboard data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData.statistics || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Faculty Officer Dashboard
              </h1>
              <p className="text-gray-600">Welcome, {user?.first_name} {user?.last_name}</p>
              <p className="text-sm text-gray-500">Faculty: {dashboardData.faculty?.name || 'N/A'}</p>
            </div>
            <div className="mt-2 md:mt-0 flex gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {stats.total_students || 0} Students
              </span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                {stats.pending_cards || 0} Pending
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_students || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <Link to="/faculty-officer/students" className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
              View All →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Cards</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_cards || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <Link to="/faculty-officer/student-cards" className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
              Review Now →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved Cards</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved_cards || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Departments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_departments || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <Link to="/faculty-officer/departments" className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
              View All →
            </Link>
          </div>
        </div>

        {/* Quick Actions - Row 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Link to="/faculty-officer/students" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow hover:bg-blue-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Students</h4>
                <p className="text-xs text-gray-500">Manage</p>
              </div>
            </div>
          </Link>

          <Link to="/faculty-officer/registrations" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow hover:bg-green-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Registrations</h4>
                <p className="text-xs text-gray-500">Approve</p>
              </div>
            </div>
          </Link>

          <Link to="/faculty-officer/student-cards" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow hover:bg-yellow-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Student Cards</h4>
                <p className="text-xs text-gray-500">Review</p>
              </div>
            </div>
          </Link>

          <Link to="/faculty-officer/lecturers" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow hover:bg-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Lecturers</h4>
                <p className="text-xs text-gray-500">Manage</p>
              </div>
            </div>
          </Link>

          <Link to="/faculty-officer/units" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow hover:bg-pink-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <svg className="h-5 w-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Units</h4>
                <p className="text-xs text-gray-500">View</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions - Row 2 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <Link to="/faculty-officer/departments" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow hover:bg-purple-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Departments</h4>
                <p className="text-xs text-gray-500">View all</p>
              </div>
            </div>
          </Link>

          <Link to="/faculty-officer/results" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow hover:bg-orange-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Results</h4>
                <p className="text-xs text-gray-500">View</p>
              </div>
            </div>
          </Link>

          <Link to="/faculty-officer/reports" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow hover:bg-teal-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Reports</h4>
                <p className="text-xs text-gray-500">Generate</p>
              </div>
            </div>
          </Link>

          <Link to="/faculty-officer/registrations" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow hover:bg-cyan-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <svg className="h-5 w-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Registrations</h4>
                <p className="text-xs text-gray-500">Pending approvals</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Department Stats */}
        {dashboardData.department_stats && dashboardData.department_stats.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData.department_stats.slice(0, 4).map((dept, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{dept.name}</h4>
                  <p className="text-sm text-gray-500">{dept.code}</p>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-600">Students: {dept.student_count || 0}</span>
                    <span className="text-gray-600">Programmes: {dept.programme_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
            {dashboardData.department_stats.length > 4 && (
              <div className="mt-4 text-center">
                <Link to="/faculty-officer/departments" className="text-blue-600 hover:text-blue-800 text-sm">
                  View All {dashboardData.department_stats.length} Departments →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link to="/faculty-officer/activity" className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          {dashboardData.recent_activities?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recent_activities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{activity.description}</p>
                    <p className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {activity.action}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyOfficerDashboard;