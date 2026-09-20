import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const FacultyLecturers = () => {
  const navigate = useNavigate();
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

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
        const [lecturersRes, deptsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/faculty-officer/lecturers`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/faculty-officer/departments`, { withCredentials: true })
        ]);
        setLecturers(lecturersRes.data.lecturers || []);
        setDepartments(deptsRes.data.departments || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load lecturers.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const filteredLecturers = lecturers.filter(lecturer => {
    const matchesSearch = lecturer.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lecturer.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lecturer.staff_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || lecturer.department_id === parseInt(selectedDepartment);
    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading lecturers...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Lecturers</h1>
              <p className="text-gray-600">Manage lecturers in your faculty</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
              <input
                type="text"
                placeholder="Search lecturers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLecturers.map((lecturer) => (
            <div key={lecturer.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {lecturer.user?.first_name?.[0]}{lecturer.user?.last_name?.[0]}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {lecturer.user?.first_name} {lecturer.user?.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{lecturer.staff_number}</p>
                  <p className="text-sm text-gray-600 mt-1">{lecturer.department_name}</p>
                  {lecturer.specialization && (
                    <p className="text-xs text-gray-500 mt-1">Specialization: {lecturer.specialization}</p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Link to={`/faculty-officer/lecturers/${lecturer.id}`} className="text-blue-600 hover:text-blue-900 text-sm">
                      View
                    </Link>
                    <Link to={`/faculty-officer/lecturers/${lecturer.id}/units`} className="text-green-600 hover:text-green-900 text-sm">
                      Units
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacultyLecturers;