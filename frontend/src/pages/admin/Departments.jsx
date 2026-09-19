import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const AdminDepartments = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    head_name: '',
    head_email: '',
    head_phone: '',
    faculty_id: ''
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

    fetchFaculties();
    fetchDepartments();
  }, [navigate]);

  const fetchFaculties = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/faculties?is_active=true`, {
        withCredentials: true
      });
      setFaculties(response.data.faculties || []);
    } catch (err) {
      console.error('Error fetching faculties:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(filterFaculty && { faculty_id: filterFaculty })
      });
      const response = await axios.get(`${API_BASE_URL}/departments?is_active=true&${params}`, {
        withCredentials: true
      });
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterFaculty) {
      fetchDepartments();
    }
  }, [filterFaculty]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        faculty_id: parseInt(formData.faculty_id)
      };
      if (editingDepartment) {
        await axios.put(
          `${API_BASE_URL}/departments/${editingDepartment.id}`,
          data,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/departments`,
          data,
          { withCredentials: true }
        );
      }
      setShowModal(false);
      resetForm();
      fetchDepartments();
    } catch (err) {
      console.error('Error saving department:', err);
      setError(err.response?.data?.error || 'Failed to save department.');
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      head_name: department.head_name || '',
      head_email: department.head_email || '',
      head_phone: department.head_phone || '',
      faculty_id: department.faculty_id
    });
    setShowModal(true);
  };

  const handleDelete = async (departmentId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/departments/${departmentId}`, { withCredentials: true });
      fetchDepartments();
    } catch (err) {
      console.error('Error deleting department:', err);
      setError('Failed to delete department.');
    }
  };

  const resetForm = () => {
    setEditingDepartment(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      head_name: '',
      head_email: '',
      head_phone: '',
      faculty_id: ''
    });
  };

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
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
              <p className="text-gray-600">Manage all departments</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              + Add Department
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-48">
              <select
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Faculties</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
              <p className="text-gray-500">No departments found.</p>
            </div>
          ) : (
            departments.map((department) => (
              <div key={department.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{department.name}</h3>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                    {department.code}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{department.description}</p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Faculty:</span> {department.faculty_name}
                </p>
                {department.head_name && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Head:</span> {department.head_name}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => handleEdit(department)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(department.id)}
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

      {/* Department Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingDepartment ? 'Edit Department' : 'Add Department'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department Name *</label>
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
                  <label className="block text-sm font-medium text-gray-700">Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Faculty *</label>
                  <select
                    name="faculty_id"
                    value={formData.faculty_id}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Faculty</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Head Name</label>
                  <input
                    type="text"
                    name="head_name"
                    value={formData.head_name}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Head Email</label>
                  <input
                    type="email"
                    name="head_email"
                    value={formData.head_email}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Head Phone</label>
                  <input
                    type="text"
                    name="head_phone"
                    value={formData.head_phone}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                  >
                    {editingDepartment ? 'Update' : 'Create'}
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

export default AdminDepartments;