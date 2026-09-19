import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const FacultyResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    semester_id: '',
    academic_year_id: '',
    programme_id: '',
    unit_id: ''
  });
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'Faculty Officer') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [resultsRes, semestersRes, yearsRes, programmesRes, unitsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/faculty-officer/results`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/semesters`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/academic-years`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/programmes`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/units`, { withCredentials: true })
        ]);
        setResults(resultsRes.data.results || []);
        setSemesters(semestersRes.data.semesters || []);
        setAcademicYears(yearsRes.data.academic_years || []);
        setProgrammes(programmesRes.data.programmes || []);
        setUnits(unitsRes.data.units || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load results.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = () => {
    // Filter results based on selected filters
    // This would typically be done on the backend
    // For now, we'll just refetch with params
    const fetchFiltered = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        const response = await axios.get(`${API_BASE_URL}/faculty-officer/results?${params}`, {
          withCredentials: true
        });
        setResults(response.data.results || []);
      } catch (err) {
        console.error('Error filtering results:', err);
        setError('Failed to filter results.');
      } finally {
        setLoading(false);
      }
    };
    fetchFiltered();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const getGradeColor = (grade) => {
    if (!grade) return 'bg-gray-100 text-gray-800';
    if (grade === 'F') return 'bg-red-100 text-red-800';
    if (grade === 'A' || grade === 'B+') return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Results</h1>
          <p className="text-gray-600">View and manage student results</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Semester</label>
              <select
                name="semester_id"
                value={filters.semester_id}
                onChange={handleFilterChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Academic Year</label>
              <select
                name="academic_year_id"
                value={filters.academic_year_id}
                onChange={handleFilterChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Programme</label>
              <select
                name="programme_id"
                value={filters.programme_id}
                onChange={handleFilterChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Programmes</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <select
                name="unit_id"
                value={filters.unit_id}
                onChange={handleFilterChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Units</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.unit_code}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={applyFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {result.student_name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">{result.registration_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{result.unit_code}</div>
                    <div className="text-sm text-gray-500">{result.unit_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.total_marks ? result.total_marks.toFixed(1) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getGradeColor(result.grade)}`}>
                      {result.grade || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.semester_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FacultyResults;