import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const FacultyStudentCards = () => {
  const navigate = useNavigate();
  const [pendingCards, setPendingCards] = useState([]);
  const [approvedCards, setApprovedCards] = useState([]);
  const [rejectedCards, setRejectedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'Faculty Officer') {
      navigate('/login');
      return;
    }

    fetchCards();
  }, [navigate]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/faculty-officer/student-cards/pending`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/faculty-officer/student-cards/approved`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/faculty-officer/student-cards/rejected`, { withCredentials: true })
      ]);
      setPendingCards(pendingRes.data.pending_cards || []);
      setApprovedCards(approvedRes.data.approved_cards || []);
      setRejectedCards(rejectedRes.data.rejected_cards || []);
    } catch (err) {
      console.error('Error fetching student cards:', err);
      setError('Failed to load student card applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (cardId) => {
    setProcessingId(cardId);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/faculty-officer/student-cards/review/${cardId}`,
        { status: 'approved' },
        { withCredentials: true }
      );

      if (response.data.message) {
        setSuccess(`Student card ${response.data.student_card.card_number} approved successfully!`);
        await fetchCards();
        setShowModal(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error approving card:', err);
      setError(err.response?.data?.error || 'Failed to approve student card.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (cardId) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }

    setProcessingId(cardId);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/faculty-officer/student-cards/review/${cardId}`,
        { 
          status: 'rejected',
          rejection_reason: rejectionReason
        },
        { withCredentials: true }
      );

      if (response.data.message) {
        setSuccess(`Student card rejected. Reason: ${rejectionReason}`);
        await fetchCards();
        setShowModal(false);
        setRejectionReason('');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error rejecting card:', err);
      setError(err.response?.data?.error || 'Failed to reject student card.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (card) => {
    setSelectedCard(card);
    setShowModal(true);
    setRejectionReason('');
    setError(null);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getCurrentCards = () => {
    switch (activeTab) {
      case 'pending':
        return pendingCards;
      case 'approved':
        return approvedCards;
      case 'rejected':
        return rejectedCards;
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading student cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Cards</h1>
              <p className="text-gray-600">Review and manage student card applications</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                Pending: {pendingCards.length}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Approved: {approvedCards.length}
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                Rejected: {rejectedCards.length}
              </span>
            </div>
          </div>
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

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending ({pendingCards.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approved'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approved ({approvedCards.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rejected'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rejected ({rejectedCards.length})
            </button>
          </nav>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getCurrentCards().length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <p>No {activeTab} applications found.</p>
            </div>
          ) : (
            getCurrentCards().map((item) => {
              const card = item.card || item;
              const student = item.student || card.student;
              const user = item.user || student?.user;
              
              return (
                <div key={card.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{card.card_number}</h3>
                      <p className="text-sm text-gray-500">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{student?.registration_number}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(card.status)}`}>
                      {card.status.toUpperCase()}
                    </span>
                  </div>

                  {card.photo && (
                    <div className="mb-3">
                      <img 
                        src={card.photo} 
                        alt="Student" 
                        className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    </div>
                  )}

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Programme: {student?.programme?.name || 'N/A'}</p>
                    <p>Applied: {new Date(card.application_date).toLocaleDateString()}</p>
                    {card.status === 'rejected' && card.rejection_reason && (
                      <p className="text-red-600 text-xs mt-2">
                        Reason: {card.rejection_reason}
                      </p>
                    )}
                    {card.status === 'approved' && card.issue_date && (
                      <p className="text-green-600 text-xs mt-2">
                        Issued: {new Date(card.issue_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleViewDetails(card)}
                      className="flex-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      View Details
                    </button>
                    {card.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(card.id)}
                          disabled={processingId === card.id}
                          className="flex-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedCard && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Student Card Details</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedCard(null);
                  setRejectionReason('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Card Number</p>
                  <p className="font-medium">{selectedCard.card_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedCard.status)}`}>
                    {selectedCard.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Student Name</p>
                  <p className="font-medium">
                    {selectedCard.student?.user?.first_name} {selectedCard.student?.user?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registration Number</p>
                  <p className="font-medium">{selectedCard.student?.registration_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Application Date</p>
                  <p className="font-medium">{new Date(selectedCard.application_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Programme</p>
                  <p className="font-medium">{selectedCard.student?.programme?.name || 'N/A'}</p>
                </div>
              </div>

              {selectedCard.photo && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Passport Photo</p>
                  <img 
                    src={selectedCard.photo} 
                    alt="Student" 
                    className="h-32 w-32 rounded-full object-cover border-2 border-gray-200"
                  />
                </div>
              )}

              {selectedCard.status === 'rejected' && selectedCard.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                  <p className="text-sm text-red-600">{selectedCard.rejection_reason}</p>
                </div>
              )}

              {selectedCard.status === 'pending' && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Review Decision</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApprove(selectedCard.id)}
                      disabled={processingId === selectedCard.id}
                      className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        if (!rejectionReason.trim()) {
                          setError('Please provide a rejection reason.');
                          return;
                        }
                        handleReject(selectedCard.id);
                      }}
                      disabled={processingId === selectedCard.id}
                      className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows="2"
                      disabled={processingId === selectedCard.id}
                    />
                  </div>
                </div>
              )}

              {selectedCard.status === 'approved' && selectedCard.card_pdf && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => window.open(selectedCard.card_pdf, '_blank')}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Download Student Card
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyStudentCards;