import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const StudentLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', path: '/student/dashboard', icon: '📊' },
    { name: 'My Profile', path: '/student/profile', icon: '👤' },
    { name: 'My Units', path: '/student/my-units', icon: '📚' },
    { name: 'Register Semester', path: '/student/register-semester', icon: '📝' },
    { name: 'Register Units', path: '/student/register-units', icon: '📋' },
    { name: 'Payments', path: '/student/payments', icon: '💰' },
    { name: 'Fee Structure', path: '/student/fee-structure', icon: '💳' },
    { name: 'Results', path: '/student/results', icon: '📊' },
    { name: 'Exam Cards', path: '/student/exam-card', icon: '🎫' },
    { name: 'Student Card', path: '/student/student-card', icon: '🪪' },
    { name: 'Announcements', path: '/student/announcements', icon: '📢' },
    { name: 'Settings', path: '/student/settings', icon: '⚙️' },
  ];

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed lg:relative inset-y-0 left-0 z-30 w-72 bg-white shadow-2xl border-r border-gray-200 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-xs text-gray-500">Student</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                location.pathname === item.path
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium text-sm flex-1">{item.name}</span>
              {location.pathname === item.path && (
                <span className="w-1.5 h-6 bg-white rounded-full"></span>
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition duration-200 group"
          >
            <span className="text-xl mr-3">🚪</span>
            <span className="font-medium text-sm">Logout</span>
            <span className="ml-auto opacity-0 group-hover:opacity-100 transition">→</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navigation Bar (Mobile) */}
        <nav className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="flex justify-between items-center h-16 px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Student Portal</h1>
            <div className="w-10"></div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;