import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [programmes, setProgrammes] = useState([]);
  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    statistics: {},
    enrolled_units: [],
    recent_payments: [],
    recent_results: []
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const userObj = JSON.parse(userData);
    setUser(userObj);

    const role = localStorage.getItem('role');
    if (role !== 'Student') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const profileRes = await axios.get(`${API_BASE_URL}/student/profile`, {
          withCredentials: true
        });
        setStudent(profileRes.data.student);
        
        if (profileRes.data.student?.programme_id) {
          setSelectedProgramme(profileRes.data.student.programme_id.toString());
        }
        
        const programmesRes = await axios.get(`${API_BASE_URL}/programmes?is_active=true`, {
          withCredentials: true
        });
        setProgrammes(programmesRes.data.programmes || []);
        
        try {
          const dashboardRes = await axios.get(`${API_BASE_URL}/student/dashboard`, {
            withCredentials: true
          });
          if (dashboardRes.data) {
            setDashboardData({
              statistics: dashboardRes.data.statistics || {},
              enrolled_units: dashboardRes.data.enrolled_units || [],
              recent_payments: dashboardRes.data.recent_payments || [],
              recent_results: dashboardRes.data.recent_results || []
            });
          }
        } catch (dashboardErr) {
          console.log('Dashboard data not available yet');
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('user');
          localStorage.removeItem('role');
          localStorage.removeItem('isAuthenticated');
          navigate('/login');
        } else {
          setError('Failed to load data. Please refresh the page.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleProgrammeSelect = async (e) => {
    e.preventDefault();
    if (!selectedProgramme) {
      setError('Please select a programme');
      return;
    }

    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/student/programme`,
        { programme_id: parseInt(selectedProgramme) },
        { withCredentials: true }
      );

      if (response.data.message) {
        setSuccess('Programme selected successfully!');
        setStudent(response.data.student);
        const updatedUser = { ...user, programme_id: parseInt(selectedProgramme) };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error('Error selecting programme:', err);
      setError(err.response?.data?.error || 'Failed to select programme.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.first_name} {user?.last_name}!
              </h1>
              <p className="text-gray-600 mt-1">
                {student?.programme_id 
                  ? `Programme: ${student?.programme_name || 'Selected'}` 
                  : 'Please select your programme to continue'}
              </p>
              <p className="text-sm text-gray-500">
                Registration: {student?.registration_number || 'Not assigned'}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {student?.programme_id ? 'Active' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Programme Selection */}
        {!student?.programme_id && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Your Programme</h2>
            <p className="text-gray-600 mb-4">Choose your academic programme to access all features.</p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {success}
              </div>
            )}

            <form onSubmit={handleProgrammeSelect}>
              <div className="mb-4">
                <label htmlFor="programme" className="block text-sm font-medium text-gray-700">
                  Choose your programme *
                </label>
                <select
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  id="programme"
                  value={selectedProgramme}
                  onChange={(e) => setSelectedProgramme(e.target.value)}
                  required
                >
                  <option value="">Select a programme...</option>
                  {programmes.map((programme) => (
                    <option key={programme.id} value={programme.id}>
                      {programme.name} - {programme.department_name || 'Department'} ({programme.duration_years} years)
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition duration-150 disabled:opacity-50"
                disabled={updating}
              >
                {updating ? 'Saving...' : 'Save Programme'}
              </button>
            </form>
          </div>
        )}

        {/* Dashboard Content */}
        {student?.programme_id && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Units Taken</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.statistics?.total_units_taken || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Payments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.statistics?.total_payments || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Results</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.statistics?.total_results || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Programme</p>
                    <p className="text-lg font-semibold text-gray-900 truncate">
                      {student?.programme_name || 'Not Set'}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Link to="/student/register-semester" className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">Register Semester</h4>
                    <p className="text-xs text-gray-500">Enroll for semester</p>
                  </div>
                </div>
              </Link>

              <Link to="/student/my-units" className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition">My Units</h4>
                    <p className="text-xs text-gray-500">View enrolled units</p>
                  </div>
                </div>
              </Link>

              <Link to="/student/payments" className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-yellow-600 transition">Payments</h4>
                    <p className="text-xs text-gray-500">View payments</p>
                  </div>
                </div>
              </Link>

              <Link to="/student/results" className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600 transition">Results</h4>
                    <p className="text-xs text-gray-500">View grades</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Additional Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/student/student-card" className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">Student Card</h4>
                    <p className="text-xs text-gray-500">Apply or view</p>
                  </div>
                </div>
              </Link>

              <Link to="/student/exam-card" className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition">
                    <svg className="h-5 w-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-pink-600 transition">Exam Cards</h4>
                    <p className="text-xs text-gray-500">View exam cards</p>
                  </div>
                </div>
              </Link>

              <Link to="/student/profile" className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-gray-600 transition">My Profile</h4>
                    <p className="text-xs text-gray-500">View & edit profile</p>
                  </div>
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;