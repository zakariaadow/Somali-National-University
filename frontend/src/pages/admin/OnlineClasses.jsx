import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const AdminOnlineClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [units, setUnits] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    unit_id: '',
    lecturer_id: '',
    class_date: '',
    duration: 60,
    meeting_link: '',
    meeting_id: '',
    meeting_password: '',
    materials: '',
    status: 'scheduled'
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

    fetchUnits();
    fetchLecturers();
    fetchClasses();
  }, [navigate]);

  const fetchUnits = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/units?is_active=true`, {
        withCredentials: true
      });
      setUnits(response.data.units || []);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  const fetchLecturers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lecturers?is_active=true`, {
        withCredentials: true
      });
      setLecturers(response.data.lecturers || []);
    } catch (err) {
      console.error('Error fetching lecturers:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/online-classes`, {
        withCredentials: true
      });
      setClasses(response.data.online_classes || []);
    } catch (err) {
      console.error('Error fetching online classes:', err);
      setError('Failed to load online classes.');
    } finally {
      setLoading(false);
    }
  };

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
        unit_id: parseInt(formData.unit_id),
        lecturer_id: parseInt(formData.lecturer_id),
        duration: parseInt(formData.duration)
      };
      if (editingClass) {
        await axios.put(
          `${API_BASE_URL}/online-classes/${editingClass.id}`,
          data,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/online-classes`,
          data,
          { withCredentials: true }
        );
      }
      setShowModal(false);
      resetForm();
      fetchClasses();
    } catch (err) {
      console.error('Error saving online class:', err);
      setError(err.response?.data?.error || 'Failed to save online class.');
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      title: classItem.title,
      description: classItem.description || '',
      unit_id: classItem.unit_id,
      lecturer_id: classItem.lecturer_id,
      class_date: classItem.class_date.substring(0, 16),
      duration: classItem.duration,
      meeting_link: classItem.meeting_link || '',
      meeting_id: classItem.meeting_id || '',
      meeting_password: classItem.meeting_password || '',
      materials: classItem.materials || '',
      status: classItem.status || 'scheduled'
    });
    setShowModal(true);
  };

  const handleDelete = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this online class?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/online-classes/${classId}`, { withCredentials: true });
      fetchClasses();
    } catch (err) {
      console.error('Error deleting online class:', err);
      setError('Failed to delete online class.');
    }
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormData({
      title: '',
      description: '',
      unit_id: '',
      lecturer_id: '',
      class_date: '',
      duration: 60,
      meeting_link: '',
      meeting_id: '',
      meeting_password: '',
      materials: '',
      status: 'scheduled'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading online classes...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Online Classes</h1>
              <p className="text-gray-600">Manage online classes</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              + Add Class
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
              <p className="text-gray-500">No online classes found.</p>
            </div>
          ) : (
            classes.map((classItem) => {
              const unit = units.find(u => u.id === classItem.unit_id);
              const lecturer = lecturers.find(l => l.id === classItem.lecturer_id);
              return (
                <div key={classItem.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{classItem.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(classItem.status)}`}>
                      {classItem.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{classItem.description}</p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Unit:</span> {unit?.unit_name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Lecturer:</span> {lecturer?.user?.first_name} {lecturer?.user?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Date:</span> {new Date(classItem.class_date).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Duration:</span> {classItem.duration} min
                  </p>
                  {classItem.meeting_link && (
                    <a
                      href={classItem.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium block mt-2"
                    >
                      Join Meeting →
                    </a>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={() => handleEdit(classItem)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(classItem.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Online Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingClass ? 'Edit Online Class' : 'Add Online Class'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
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
                  <label className="block text-sm font-medium text-gray-700">Unit *</label>
                  <select
                    name="unit_id"
                    value={formData.unit_id}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_code} - {u.unit_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lecturer *</label>
                  <select
                    name="lecturer_id"
                    value={formData.lecturer_id}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Lecturer</option>
                    {lecturers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.user?.first_name} {l.user?.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date & Time *</label>
                  <input
                    type="datetime-local"
                    name="class_date"
                    value={formData.class_date}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (minutes) *</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="15"
                    max="180"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meeting Link</label>
                  <input
                    type="url"
                    name="meeting_link"
                    value={formData.meeting_link}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://meet.google.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meeting ID</label>
                  <input
                    type="text"
                    name="meeting_id"
                    value={formData.meeting_id}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meeting Password</label>
                  <input
                    type="text"
                    name="meeting_password"
                    value={formData.meeting_password}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Materials</label>
                  <textarea
                    name="materials"
                    value={formData.materials}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter materials or resources"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                  >
                    {editingClass ? 'Update' : 'Create'}
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

export default AdminOnlineClasses;