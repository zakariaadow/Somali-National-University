import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const StudentCard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [studentCard, setStudentCard] = useState(null);
  const [hasApplication, setHasApplication] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const fetchStudentCard = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/student/student-card`, {
          withCredentials: true
        });
        
        if (response.data && response.data.has_application) {
          setStudentCard(response.data.student_card);
          setHasApplication(true);
        } else {
          setHasApplication(false);
          setStudentCard(null);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching student card:', err);
        if (err.response?.status === 404) {
          setHasApplication(false);
          setStudentCard(null);
        } else {
          setError('Failed to load student card. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudentCard();
  }, [navigate]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) {
      setError('Please upload a passport photo.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('photo', photo);

      const response = await axios.post(
        `${API_BASE_URL}/student/apply-student-card`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.message) {
        setSuccess('Student card application submitted successfully!');
        setStudentCard(response.data.student_card);
        setHasApplication(true);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error applying for student card:', err);
      setError(err.response?.data?.error || 'Failed to apply for student card.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return 'Unknown';
    return status.toUpperCase();
  };

  if (loading && !studentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading student card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Card</h1>
          <p className="text-gray-600">Apply for or view your student card.</p>
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

        {hasApplication && studentCard ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Card Status</h2>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(studentCard.status)}`}>
                {getStatusBadge(studentCard.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Card Number</p>
                <p className="font-medium">{studentCard.card_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Application Date</p>
                <p className="font-medium">
                  {studentCard.application_date ? new Date(studentCard.application_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              {studentCard.issue_date && (
                <div>
                  <p className="text-sm text-gray-500">Issue Date</p>
                  <p className="font-medium">{new Date(studentCard.issue_date).toLocaleDateString()}</p>
                </div>
              )}
              {studentCard.expiry_date && (
                <div>
                  <p className="text-sm text-gray-500">Expiry Date</p>
                  <p className="font-medium">{new Date(studentCard.expiry_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {studentCard.rejection_reason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <p className="font-medium">Rejection Reason:</p>
                <p>{studentCard.rejection_reason}</p>
              </div>
            )}

            {studentCard.status && studentCard.status.toLowerCase() === 'approved' && studentCard.card_pdf && (
              <button
                onClick={() => window.open(studentCard.download_url, '_blank')}
                className="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-150"
              >
                Download Student Card
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Apply for Student Card</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Passport Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="mt-1 w-full"
                  required
                />
                {preview && (
                  <div className="mt-2">
                    <img src={preview} alt="Preview" className="h-32 w-32 object-cover rounded-lg" />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Upload a recent passport-size photo (JPEG, PNG)</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Apply for Student Card'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCard;