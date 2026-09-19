import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const CollegeRegistrations = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [processingId, setProcessingId] = useState(null);

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

    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/college-officer/registrations`, {
          params: { is_approved: false },
          withCredentials: true
        });
        setRegistrations(response.data.registrations || []);
      } catch (err) {
        console.error('Error fetching registrations:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load registrations.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [navigate]);

  const handleApprove = async (registrationId) => {
    setProcessingId(registrationId);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/college-officer/registrations/approve/${registrationId}`,
        {},
        { withCredentials: true }
      );

      if (response.data.message) {
        setSuccess('Registration approved successfully!');
        setRegistrations(prev => prev.filter(r => r.registration.id !== registrationId));
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error approving registration:', err);
      setError(err.response?.data?.error || 'Failed to approve registration.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pending Registrations</h1>
          <p className="text-gray-600">Review and approve student registrations</p>
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

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {registrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No pending registrations.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((item) => (
                  <tr key={item.registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.student?.user?.first_name} {item.student?.user?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{item.student?.registration_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.student?.programme?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.registration.semester_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.registration.registration_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleApprove(item.registration.id)}
                        disabled={processingId === item.registration.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingId === item.registration.id ? 'Processing...' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollegeRegistrations;