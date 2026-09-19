import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [units, setUnits] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const queryParams = new URLSearchParams(location.search);
  const unitIdFromUrl = queryParams.get('unit_id');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'Lecturer') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [unitsRes, semestersRes, academicYearsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/lecturer/my-units`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/semesters`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/academic-years`, { withCredentials: true })
        ]);
        
        setUnits(unitsRes.data.units || []);
        setSemesters(semestersRes.data.semesters || []);
        setAcademicYears(academicYearsRes.data.academic_years || []);
        
        // Set current semester and academic year
        const currentSemester = semestersRes.data.semesters?.find(s => s.is_current);
        const currentYear = academicYearsRes.data.academic_years?.find(y => y.is_current);
        if (currentSemester) setSemesterId(currentSemester.id);
        if (currentYear) setAcademicYearId(currentYear.id);
        
        if (unitIdFromUrl) {
          setSelectedUnit(unitIdFromUrl);
          await fetchStudents(unitIdFromUrl);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, unitIdFromUrl]);

  const fetchStudents = async (unitId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lecturer/unit-students/${unitId}`, {
        withCredentials: true
      });
      setStudents(response.data.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students.');
    }
  };

  const handleUnitChange = async (e) => {
    const unitId = e.target.value;
    setSelectedUnit(unitId);
    if (unitId) {
      await fetchStudents(unitId);
    } else {
      setStudents([]);
    }
  };

  const handlePublishResults = async () => {
    if (!selectedUnit || !semesterId || !academicYearId) {
      setError('Please select a unit, semester, and academic year.');
      return;
    }

    setPublishing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/lecturer/publish-results`,
        {
          unit_id: parseInt(selectedUnit),
          semester_id: parseInt(semesterId),
          academic_year_id: parseInt(academicYearId)
        },
        { withCredentials: true }
      );

      if (response.data.message) {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error publishing results:', err);
      setError(err.response?.data?.error || 'Failed to publish results.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Publish Results</h1>
          <p className="text-gray-600">Publish final results for your units.</p>
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

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Select Unit *</label>
            <select
              value={selectedUnit}
              onChange={handleUnitChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a unit...</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_code} - {unit.unit_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Semester</label>
              <select
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Semester</option>
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Academic Year</label>
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedUnit && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Students ({students.length})
              </h3>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Registration</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-center text-gray-500">No students enrolled.</td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr key={student.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{student.registration_number}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {student.user?.first_name} {student.user?.last_name}
                          </td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={handlePublishResults}
            disabled={publishing || students.length === 0}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm transition duration-150 disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : 'Publish Results'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;