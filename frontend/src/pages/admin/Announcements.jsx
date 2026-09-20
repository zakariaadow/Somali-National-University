import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const AdminAnnouncements = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcement_type: 'general',
    priority: 'normal',
    target_audience: 'all',
    expiry_date: ''
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

    fetchAnnouncements();
  }, [navigate]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/announcements?is_active=true`, {
        withCredentials: true
      });
      setAnnouncements(response.data.announcements || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements.');
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
      if (editingAnnouncement) {
        await axios.put(
          `${API_BASE_URL}/announcements/${editingAnnouncement.id}`,
          formData,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/announcements`,
          formData,
          { withCredentials: true }
        );
      }
      setShowModal(false);
      resetForm();
      fetchAnnouncements();
    } catch (err) {
      console.error('Error saving announcement:', err);
      setError(err.response?.data?.error || 'Failed to save announcement.');
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      announcement_type: announcement.announcement_type || 'general',
      priority: announcement.priority || 'normal',
      target_audience: announcement.target_audience || 'all',
      expiry_date: announcement.expiry_date || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/announcements/${announcementId}`, { withCredentials: true });
      fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('Failed to delete announcement.');
    }
  };

  const resetForm = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      announcement_type: 'general',
      priority: 'normal',
      target_audience: 'all',
      expiry_date: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading announcements...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
              <p className="text-gray-600">Manage university announcements</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              + Add Announcement
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
              <p>No announcements found.</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{announcement.title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        announcement.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        announcement.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {announcement.priority || 'normal'}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                        {announcement.announcement_type}
                      </span>
                    </div>
                    <p className="text-gray-600">{announcement.content}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>Target: {announcement.target_audience}</span>
                      <span>•</span>
                      <span>Published: {new Date(announcement.published_date).toLocaleDateString()}</span>
                      {announcement.expiry_date && (
                        <>
                          <span>•</span>
                          <span>Expires: {new Date(announcement.expiry_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingAnnouncement ? 'Edit Announcement' : 'Add Announcement'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700">Content *</label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    name="announcement_type"
                    value={formData.announcement_type}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="financial">Financial</option>
                    <option value="administrative">Administrative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                  <select
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="students">Students</option>
                    <option value="staff">Staff</option>
                    <option value="faculty">Faculty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                  >
                    {editingAnnouncement ? 'Update' : 'Create'}
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

export default AdminAnnouncements;