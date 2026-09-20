import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const AdminSemesters = () => {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    semester_number: 1,
    start_date: '',
    end_date: '',
    registration_start: '',
    registration_end: '',
    is_current: false,
    academic_year_id: ''
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
    fetchSemesters();
  }, [navigate]);

  const fetchAcademicYears = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/academic-years?is_active=true`, {
        withCredentials: true
      });
      setAcademicYears(response.data.academic_years || []);
    } catch (err) {
      console.error('Error fetching academic years:', err);
    }
  };

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/semesters?is_active=true`, {
        withCredentials: true
      });
      setSemesters(response.data.semesters || []);
    } catch (err) {
      console.error('Error fetching semesters:', err);
      setError('Failed to load semesters.');
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
        academic_year_id: parseInt(formData.academic_year_id),
        semester_number: parseInt(formData.semester_number)
      };
      if (editingSemester) {
        await axios.put(
          `${API_BASE_URL}/semesters/${editingSemester.id}`,
          data,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/semesters`,
          data,
          { withCredentials: true }
        );
      }
      setShowModal(false);
      resetForm();
      fetchSemesters();
    } catch (err) {
      console.error('Error saving semester:', err);
      setError(err.response?.data?.error || 'Failed to save semester.');
    }
  };

  const handleEdit = (semester) => {
    setEditingSemester(semester);
    setFormData({
      name: semester.name,
      semester_number: semester.semester_number,
      start_date: semester.start_date,
      end_date: semester.end_date,
      registration_start: semester.registration_start,
      registration_end: semester.registration_end,
      is_current: semester.is_current,
      academic_year_id: semester.academic_year_id
    });
    setShowModal(true);
  };

  const handleDelete = async (semesterId) => {
    if (!window.confirm('Are you sure you want to delete this semester?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/semesters/${semesterId}`, { withCredentials: true });
      fetchSemesters();
    } catch (err) {
      console.error('Error deleting semester:', err);
      setError('Failed to delete semester.');
    }
  };

  const resetForm = () => {
    setEditingSemester(null);
    setFormData({
      name: '',
      semester_number: 1,
      start_date: '',
      end_date: '',
      registration_start: '',
      registration_end: '',
      is_current: false,
      academic_year_id: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading semesters...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Semesters</h1>
              <p className="text-gray-600">Manage academic semesters</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              + Add Semester
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Semesters Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {semesters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No semesters found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {semesters.map((semester) => {
                    const academicYear = academicYears.find(ay => ay.id === semester.academic_year_id);
                    return (
                      <tr key={semester.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {semester.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {academicYear?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(semester.start_date).toLocaleDateString()} - {new Date(semester.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(semester.registration_start).toLocaleDateString()} - {new Date(semester.registration_end).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            semester.is_current ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {semester.is_current ? 'Current' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(semester)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(semester.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Semester Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingSemester ? 'Edit Semester' : 'Add Semester'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Semester Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Semester Number *</label>
                  <input
                    type="number"
                    name="semester_number"
                    value={formData.semester_number}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year *</label>
                  <select
                    name="academic_year_id"
                    value={formData.academic_year_id}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name}
                      </option>
                    ))}
                  </select>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Start *</label>
                    <input
                      type="date"
                      name="registration_start"
                      value={formData.registration_start}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registration End *</label>
                    <input
                      type="date"
                      name="registration_end"
                      value={formData.registration_end}
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
                  <label className="ml-2 text-sm text-gray-700">Set as Current Semester</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                  >
                    {editingSemester ? 'Update' : 'Create'}
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

export default AdminSemesters;