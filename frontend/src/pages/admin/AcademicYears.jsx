import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const AdminAcademicYears = () => {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    start_year: new Date().getFullYear(),
    end_year: new Date().getFullYear() + 1,
    start_date: '',
    end_date: '',
    is_current: false
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'Admin') {
      navigate('/login');
      return;
    }

    fetchAcademicYears();
  }, [navigate]);

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/academic-years?is_active=true`, {
        withCredentials: true
      });
      setAcademicYears(response.data.academic_years || []);
    } catch (err) {
      console.error('Error fetching academic years:', err);
      setError('Failed to load academic years.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        start_year: parseInt(formData.start_year),
        end_year: parseInt(formData.end_year)
      };
      if (editingYear) {
        await axios.put(
          `${API_BASE_URL}/academic-years/${editingYear.id}`,
          data,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/academic-years`,
          data,
          { withCredentials: true }
        );
      }
      setShowModal(false);
      resetForm();
      fetchAcademicYears();
    } catch (err) {
      console.error('Error saving academic year:', err);
      setError(err.response?.data?.error || 'Failed to save academic year.');
    }
  };

  const handleEdit = (year) => {
    setEditingYear(year);
    setFormData({
      name: year.name,
      start_year: year.start_year,
      end_year: year.end_year,
      start_date: year.start_date,
      end_date: year.end_date,
      is_current: year.is_current
    });
    setShowModal(true);
  };

  const handleDelete = async (yearId) => {
    if (!window.confirm('Are you sure you want to delete this academic year?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/academic-years/${yearId}`, { withCredentials: true });
      fetchAcademicYears();
    } catch (err) {
      console.error('Error deleting academic year:', err);
      setError('Failed to delete academic year.');
    }
  };

  const resetForm = () => {
    setEditingYear(null);
    setFormData({
      name: '',
      start_year: new Date().getFullYear(),
      end_year: new Date().getFullYear() + 1,
      start_date: '',
      end_date: '',
      is_current: false
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading academic years...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Academic Years</h1>
              <p className="text-gray-600">Manage academic years</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              + Add Academic Year
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {academicYears.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
              <p className="text-gray-500">No academic years found.</p>
            </div>
          ) : (
            academicYears.map((year) => (
              <div key={year.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{year.name}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    year.is_current ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {year.is_current ? 'Current' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {year.start_year} - {year.end_year}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => handleEdit(year)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(year.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Academic Year Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingYear ? 'Edit Academic Year' : 'Add Academic Year'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Year *</label>
                    <input
                      type="number"
                      name="start_year"
                      value={formData.start_year}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Year *</label>
                    <input
                      type="number"
                      name="end_year"
                      value={formData.end_year}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date *</label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_current"
                    checked={formData.is_current}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Set as Current Academic Year</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                  >
                    {editingYear ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAcademicYears;