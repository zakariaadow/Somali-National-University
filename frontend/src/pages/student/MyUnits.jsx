import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const MyUnits = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const fetchUnits = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`${API_BASE_URL}/student/my-units`, {
          withCredentials: true
        });
        setUnits(response.data.units || []);
      } catch (err) {
        console.error('Error fetching units:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError(err.response?.data?.error || 'Failed to load units.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading your units...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Units</h1>
          <p className="text-gray-600">Units you are currently enrolled in</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
              <p className="text-gray-500">You haven't registered for any units yet.</p>
              <Link to="/student/register-units" className="text-blue-600 hover:underline mt-2 inline-block">
                Register for units
              </Link>
            </div>
          ) : (
            units.map((unit) => (
              <div key={unit.id} className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900">{unit.unit_code}</h3>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {unit.credits} credits
                  </span>
                </div>
                <p className="text-gray-700 mt-1">{unit.unit_name}</p>
                <p className="text-sm text-gray-500 mt-1">{unit.department_name}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Semester: {unit.semester_name}
                </p>
                {unit.is_completed && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-green-600">
                      Grade: {unit.grade || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyUnits;