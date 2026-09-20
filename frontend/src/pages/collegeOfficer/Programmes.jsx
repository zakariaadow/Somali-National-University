import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const CollegeProgrammes = () => {
  const navigate = useNavigate();
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    const fetchProgrammes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/college-officer/programmes`, {
          withCredentials: true
        });
        setProgrammes(response.data.programmes || []);
      } catch (err) {
        console.error('Error fetching programmes:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load programmes.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProgrammes();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading programmes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Programmes</h1>
          <p className="text-gray-600">Manage programmes in your college</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programmes.map((programme) => (
            <div key={programme.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-900">{programme.name}</h3>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {programme.code}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{programme.description}</p>
              <div className="mt-4 flex justify-between text-sm text-gray-500">
                <span>Department: {programme.department_name}</span>
                <span>{programme.duration_years} years</span>
              </div>
              <div className="mt-4">
                <Link to={`/college-officer/programmes/${programme.id}`} className="text-blue-600 hover:text-blue-900 text-sm">
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

export default CollegeProgrammes;