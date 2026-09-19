import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const LecturerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', path: '/lecturer/dashboard', icon: '📊' },
    { name: 'My Units', path: '/lecturer/my-units', icon: '📚' },
    { name: 'Students', path: '/lecturer/students', icon: '🎓' },
    { name: 'Assessments', path: '/lecturer/assessments', icon: '📝' },
    { name: 'Attendance', path: '/lecturer/attendance', icon: '✅' },
    { name: 'Results', path: '/lecturer/results', icon: '📊' },
    { name: 'Online Classes', path: '/lecturer/online-classes', icon: '💻' },
    { name: 'Materials', path: '/lecturer/materials', icon: '📄' },
    { name: 'Profile', path: '/lecturer/profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-gradient-to-r from-green-700 to-green-800 shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-green-100 hover:text-white hover:bg-green-600 transition"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-white">Lecturer Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-green-100 hover:text-white hover:bg-green-600 rounded-lg transition">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className={`fixed lg:static inset-y-0 left-0 z-20 w-64 bg-white shadow-xl border-r border-gray-200 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition duration-300 ease-in-out`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 lg:hidden">
            <span className="font-bold text-gray-900">Menu</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/25'
                    : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <span className="font-medium text-sm">{item.name}</span>
                {location.pathname === item.path && (
                  <span className="ml-auto">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default LecturerLayout;