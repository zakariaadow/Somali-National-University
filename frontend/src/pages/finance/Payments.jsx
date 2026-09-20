import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const FinancePayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'Finance Officer') {
      navigate('/login');
      return;
    }

    fetchPayments();
  }, [navigate, filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const isVerified = filter === 'verified' ? true : filter === 'pending' ? false : undefined;
      const response = await axios.get(`${API_BASE_URL}/finance/payments`, {
        params: { is_verified: isVerified },
        withCredentials: true
      });
      setPayments(response.data.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load payments.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId) => {
    setProcessingId(paymentId);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/finance/verify-payment`,
        { payment_id: paymentId },
        { withCredentials: true }
      );

      if (response.data.message) {
        setSuccess('Payment verified successfully! Receipt and Exam Card generated.');
        // Refresh payments
        await fetchPayments();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError(err.response?.data?.error || 'Failed to verify payment.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
  };

  const filteredPayments = payments.filter(payment => {
    const search = searchTerm.toLowerCase();
    return payment.student_name?.toLowerCase().includes(search) ||
           payment.payment_reference?.toLowerCase().includes(search) ||
           payment.transaction_id?.toLowerCase().includes(search);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="all">All</option>
              </select>
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

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.student_name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">{payment.registration_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.payment_reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${payment.amount?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.payment_method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleViewDetails(payment)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    {!payment.is_verified && (
                      <button
                        onClick={() => handleVerify(payment.id)}
                        disabled={processingId === payment.id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {processingId === payment.id ? 'Processing...' : 'Verify'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-medium">{selectedPayment.payment_reference}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium text-lg text-green-600">${selectedPayment.amount?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Student</p>
                  <p className="font-medium">{selectedPayment.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registration</p>
                  <p className="font-medium">{selectedPayment.registration_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Method</p>
                  <p className="font-medium">{selectedPayment.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-medium">{selectedPayment.transaction_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{new Date(selectedPayment.payment_date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedPayment.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedPayment.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>

              {selectedPayment.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium">{selectedPayment.notes}</p>
                </div>
              )}

              {!selectedPayment.is_verified && (
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      handleVerify(selectedPayment.id);
                      handleCloseModal();
                    }}
                    disabled={processingId === selectedPayment.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {processingId === selectedPayment.id ? 'Processing...' : 'Verify Payment'}
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

export default FinancePayments;