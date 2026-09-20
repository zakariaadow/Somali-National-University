import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    statistics: {},
    pending_payments: [],
    today_collections: [],
    recent_transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));

    const role = localStorage.getItem('role');
    if (role !== 'Finance Officer') {
      navigate('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/finance/dashboard`, {
          withCredentials: true
        });
        setDashboardData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load dashboard data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData.statistics || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Finance Dashboard
          </h1>
          <p className="text-gray-600">Welcome, {user?.first_name} {user?.last_name}</p>
          <p className="text-sm text-gray-500">Manage student payments and financial records</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_payments || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Collections</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(stats.today_collections || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">
                  ${(stats.outstanding_balance || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${(stats.total_revenue || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Link to="/finance/payments" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Payments</h4>
                <p className="text-xs text-gray-500">View & verify payments</p>
              </div>
            </div>
          </Link>

          <Link to="/finance/receipts" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Receipts</h4>
                <p className="text-xs text-gray-500">Generate & manage receipts</p>
              </div>
            </div>
          </Link>

          <Link to="/finance/exam-cards" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Exam Cards</h4>
                <p className="text-xs text-gray-500">Generate exam cards</p>
              </div>
            </div>
          </Link>

          <Link to="/finance/fee-structures" className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Fee Structure</h4>
                <p className="text-xs text-gray-500">Manage fee structures</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          {dashboardData.recent_transactions?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recent_transactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.student_name}</p>
                    <p className="text-xs text-gray-500">{transaction.payment_reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">${transaction.amount?.toFixed(2)}</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent transactions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;