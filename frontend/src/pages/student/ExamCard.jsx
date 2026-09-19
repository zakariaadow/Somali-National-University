import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const ExamCard = () => {
  const navigate = useNavigate();
  const [examCards, setExamCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const fetchExamCards = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/student/exam-cards`, {
          withCredentials: true
        });
        setExamCards(response.data.exam_cards || []);
      } catch (err) {
        console.error('Error fetching exam cards:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load exam cards.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExamCards();
  }, [navigate]);

  const handleDownload = async (examCardId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/student/exam-cards/${examCardId}/download`,
        { withCredentials: true }
      );
      if (response.data.download_url) {
        window.open(response.data.download_url, '_blank');
      }
    } catch (err) {
      console.error('Error downloading exam card:', err);
      setError('Failed to download exam card.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading exam cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Exam Cards</h1>
          <p className="text-gray-600">View and download your exam cards.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {examCards.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
              <p>No exam cards available.</p>
              <p className="text-sm mt-2">Exam cards are generated after payment verification.</p>
            </div>
          ) : (
            examCards.map((card) => (
              <div key={card.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">{card.exam_card_number}</h3>
                    <p className="text-sm text-gray-500">Semester: {card.semester_name}</p>
                    <p className="text-sm text-gray-500">Academic Year: {card.academic_year}</p>
                    <p className="text-xs text-gray-400">
                      Generated: {new Date(card.generated_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      card.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {card.is_approved ? 'Approved' : 'Pending'}
                    </span>
                    {card.is_approved && (
                      <button
                        onClick={() => handleDownload(card.id)}
                        className="mt-2 block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                      >
                        Download PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamCard;