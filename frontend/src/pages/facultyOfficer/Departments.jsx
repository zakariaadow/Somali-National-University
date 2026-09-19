import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const FacultyDepartments = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/faculty-officer/departments`, {
          withCredentials: true
        });
        setDepartments(response.data.departments || []);
      } catch (err) {
        console.error('Error fetching departments:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load departments.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600">Manage departments in your faculty</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {dept.code}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{dept.description}</p>
              <div className="mt-4 flex justify-between text-sm text-gray-500">
                <span>Students: {dept.student_count || 0}</span>
                <span>Programmes: {dept.programme_count || 0}</span>
              </div>
              <div className="mt-4">
                <Link to={`/faculty-officer/departments/${dept.id}`} className="text-blue-600 hover:text-blue-900 text-sm">
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacultyDepartments;