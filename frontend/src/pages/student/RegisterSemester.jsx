import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const RegisterSemester = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [semestersRes, academicYearsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/semesters?is_active=true`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/academic-years?is_active=true`, { withCredentials: true })
        ]);
        
        setSemesters(semestersRes.data.semesters || []);
        setAcademicYears(academicYearsRes.data.academic_years || []);
        
        const currentSemester = semestersRes.data.semesters?.find(s => s.is_current);
        const currentYear = academicYearsRes.data.academic_years?.find(y => y.is_current);
        
        if (currentSemester) setSelectedSemester(currentSemester.id);
        if (currentYear) setSelectedAcademicYear(currentYear.id);
        
        try {
          const registrationsRes = await axios.get(`${API_BASE_URL}/student/registrations`, {
            withCredentials: true
          });
          setRegistrations(registrationsRes.data.registrations || []);
        } catch (regErr) {
          console.log('No registrations found');
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load registration data.');
      }
    };

    fetchData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSemester || !selectedAcademicYear) {
      setError('Please select both semester and academic year.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/student/register-semester`,
        {
          semester_id: parseInt(selectedSemester),
          academic_year_id: parseInt(selectedAcademicYear)
        },
        { withCredentials: true }
      );

      if (response.data.message) {
        setSuccess('Semester registration successful!');
        try {
          const registrationsRes = await axios.get(`${API_BASE_URL}/student/registrations`, {
            withCredentials: true
          });
          setRegistrations(registrationsRes.data.registrations || []);
        } catch (regErr) {
          console.log('Could not refresh registrations');
        }
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error registering semester:', err);
      setError(err.response?.data?.error || 'Failed to register semester.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Register for Semester</h1>
          <p className="text-gray-600">Select the semester and academic year to register.</p>
        </div>

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

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Academic Year</label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Semester</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name} ({new Date(semester.start_date).toLocaleDateString()} - {new Date(semester.end_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition duration-150 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Semester'}
            </button>
          </form>
        </div>

        {registrations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Registrations</h2>
            <div className="space-y-2">
              {registrations.map((reg) => (
                <div key={reg.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{reg.semester_name}</p>
                    <p className="text-sm text-gray-500">{reg.academic_year}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    reg.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {reg.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/student/register-units" className="text-blue-600 hover:underline">
            Next: Register for Units →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterSemester;