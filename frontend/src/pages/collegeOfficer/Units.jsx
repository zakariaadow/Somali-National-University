import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const CollegeUnits = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);

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

    const fetchData = async () => {
      try {
        setLoading(true);
        const [unitsRes, facultiesRes, deptsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/college-officer/units`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/college-officer/faculties`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/college-officer/departments`, { withCredentials: true })
        ]);
        setUnits(unitsRes.data.units || []);
        setFaculties(facultiesRes.data.faculties || []);
        setDepartments(deptsRes.data.departments || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load units.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.unit_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          unit.unit_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaculty = !selectedFaculty || unit.faculty_id === parseInt(selectedFaculty);
    const matchesDepartment = !selectedDepartment || unit.department_id === parseInt(selectedDepartment);
    return matchesSearch && matchesFaculty && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading units...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Units</h1>
              <p className="text-gray-600">Manage units across your college</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
              <input
                type="text"
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Faculties</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => (
            <div key={unit.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{unit.unit_name}</h3>
                  <p className="text-sm text-blue-600 font-mono">{unit.unit_code}</p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {unit.credits} credits
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{unit.description}</p>
              <div className="mt-4 text-sm text-gray-500">
                <p>Department: {unit.department_name}</p>
                <p>Faculty: {unit.faculty_name}</p>
                <p>Semester: {unit.semester_name}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to={`/college-officer/units/${unit.id}`} className="text-blue-600 hover:text-blue-900 text-sm">
                  View
                </Link>
                <Link to={`/college-officer/units/${unit.id}/lecturers`} className="text-green-600 hover:text-green-900 text-sm">
                  Lecturers
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollegeUnits;