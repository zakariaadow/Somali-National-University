import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if we're on an authenticated route
  const isAuthRoute = location.pathname.startsWith('/student') || 
                      location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/lecturer') || 
                      location.pathname.startsWith('/finance') || 
                      location.pathname.startsWith('/faculty-officer') || 
                      location.pathname.startsWith('/college-officer') ||
                      location.pathname === '/dashboard';

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated') === 'true';
    const role = localStorage.getItem('role');
    setIsAuthenticated(auth);
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (userRole === 'Student') return '/student/dashboard';
    if (userRole === 'Admin') return '/admin/dashboard';
    if (userRole === 'Lecturer') return '/lecturer/dashboard';
    if (userRole === 'Finance Officer') return '/finance/dashboard';
    if (userRole === 'Faculty Officer') return '/faculty-officer/dashboard';
    if (userRole === 'College Officer') return '/college-officer/dashboard';
    return '/dashboard';
  };

  // Don't show navbar on authenticated routes
  if (isAuthRoute && isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <img 
                  src="/WhatsApp%20Image%202026-07-18%20at%2010.18.04.jpeg" 
                  alt="Somali National University Logo" 
                  className="h-12 w-12 object-cover rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 leading-tight">
                  SNU Portal
                </span>
                <span className="text-xs text-gray-500 leading-tight">
                  Somali National University
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition duration-150">
              Home
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-blue-600 transition duration-150">
              About
            </Link>
            <Link to="/faculties" className="text-gray-700 hover:text-blue-600 transition duration-150">
              Faculties
            </Link>
            <Link to="/colleges" className="text-gray-700 hover:text-blue-600 transition duration-150">
              Colleges
            </Link>
            <Link to="/news" className="text-gray-700 hover:text-blue-600 transition duration-150">
              News
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 transition duration-150">
              Contact
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to={getDashboardLink()} 
                  className="text-blue-600 hover:text-blue-800 font-medium transition duration-150"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition duration-150"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition duration-150"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg transition duration-150"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none transition duration-150"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className="block px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/faculties" 
              className="block px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              Faculties
            </Link>
            <Link 
              to="/colleges" 
              className="block px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              Colleges
            </Link>
            <Link 
              to="/news" 
              className="block px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              News
            </Link>
            <Link 
              to="/contact" 
              className="block px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>

            {isAuthenticated ? (
              <>
                <Link 
                  to={getDashboardLink()} 
                  className="block px-3 py-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium transition duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition duration-150"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium transition duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;