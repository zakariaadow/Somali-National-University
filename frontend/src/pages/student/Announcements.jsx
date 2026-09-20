import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const Announcements = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/announcements`, {
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

    fetchAnnouncements();
  }, [navigate]);

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
              <p>No announcements available.</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    announcement.priority === 'high' ? 'bg-red-100 text-red-800' :
                    announcement.priority === 'urgent' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {announcement.priority || 'Normal'}
                  </span>
                </div>
                <p className="text-gray-700 mt-2">{announcement.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(announcement.published_date).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Announcements;