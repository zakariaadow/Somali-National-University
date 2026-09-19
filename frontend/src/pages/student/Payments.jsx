import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const Payments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    registration_id: '',
    amount: '',
    payment_method: 'bank_transfer',
    transaction_id: ''
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const fetchPayments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/student/payments`, {
          withCredentials: true
        });
        setPayments(response.data.payments || []);
        setTotal(response.data.total || 0);
      } catch (err) {
        console.error('Error fetching payments:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError(err.response?.data?.error || 'Failed to load payments.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [navigate]);

  const handlePaymentInputChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentData.registration_id || !paymentData.amount) {
      setPaymentError('Please fill in all required fields.');
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/student/make-payment`,
        {
          registration_id: parseInt(paymentData.registration_id),
          amount: parseFloat(paymentData.amount),
          payment_method: paymentData.payment_method,
          transaction_id: paymentData.transaction_id || `TXN${Date.now()}`
        },
        { withCredentials: true }
      );

      if (response.data.message) {
        setPaymentSuccess('Payment recorded successfully! Awaiting verification.');
        setShowPaymentModal(false);
        // Refresh payments
        const refreshResponse = await axios.get(`${API_BASE_URL}/student/payments`, {
          withCredentials: true
        });
        setPayments(refreshResponse.data.payments || []);
        setTotal(refreshResponse.data.total || 0);
        setTimeout(() => setPaymentSuccess(null), 5000);
      }
    } catch (err) {
      console.error('Error making payment:', err);
      setPaymentError(err.response?.data?.error || 'Failed to process payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'bank_transfer': return '🏦';
      case 'mobile_money': return '📱';
      case 'cash': return '💰';
      default: return '💳';
    }
  };

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
              <p className="text-gray-600">View your payment history and make new payments</p>
            </div>
            <div className="flex gap-3">
              <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                Total Payments: {total}
              </span>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm transition duration-150"
              >
                💳 Make Payment
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {paymentSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {paymentSuccess}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">💳</div>
              <p className="text-lg font-medium text-gray-700">No payments recorded</p>
              <p className="text-sm mt-1">Click the "Make Payment" button to pay your fees</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.payment_reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${payment.amount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          {getPaymentMethodIcon(payment.payment_method)}
                          {payment.payment_method?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.is_verified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.is_verified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link to="/student/fee-structure" className="text-blue-600 hover:underline">
            View Fee Structure →
          </Link>
          <Link to="/student/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard →
          </Link>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowPaymentModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Make Payment</h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {paymentError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {paymentError}
                  </div>
                )}

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Registration ID *
                    </label>
                    <input
                      type="number"
                      name="registration_id"
                      value={paymentData.registration_id}
                      onChange={handlePaymentInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter registration ID"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Find your registration ID from the semester registration page</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={paymentData.amount}
                      onChange={handlePaymentInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter amount"
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Payment Method *
                    </label>
                    <select
                      name="payment_method"
                      value={paymentData.payment_method}
                      onChange={handlePaymentInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                      <option value="mobile_money">📱 Mobile Money</option>
                      <option value="cash">💰 Cash</option>
                      <option value="credit_card">💳 Credit Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Transaction ID (optional)
                    </label>
                    <input
                      type="text"
                      name="transaction_id"
                      value={paymentData.transaction_id}
                      onChange={handlePaymentInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter transaction ID"
                    />
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <p className="text-sm text-yellow-700">
                      ⚠️ Your payment will be pending until verified by the finance office.
                      Please keep your transaction details for reference.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Confirm Payment'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;