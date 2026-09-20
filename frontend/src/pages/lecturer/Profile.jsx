import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const [lecturer, setLecturer] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    phone: '',
    email: '',
    username: '',
    qualification: '',
    specialization: ''
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
    if (role !== 'Lecturer') {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
          withCredentials: true
        });
        
        const data = response.data;
        setLecturer(data.profile);
        setFormData({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          middle_name: data.user.middle_name || '',
          phone: data.user.phone || '',
          email: data.user.email || '',
          username: data.user.username || '',
          qualification: data.profile?.qualification || '',
          specialization: data.profile?.specialization || ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load profile.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name,
          phone: formData.phone
        },
        { withCredentials: true }
      );

      if (response.data.message) {
        setSuccess('Profile updated successfully!');
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
          
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

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Staff Number</p>
                <p className="font-medium">{lecturer?.staff_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{lecturer?.department_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Qualification</p>
                <p className="font-medium">{lecturer?.qualification || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Specialization</p>
                <p className="font-medium">{lecturer?.specialization || 'N/A'}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Middle Name</label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                disabled
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition duration-150 disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;