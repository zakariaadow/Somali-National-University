import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  // Check if we're on an authenticated route
  const isAuthRoute = location.pathname.startsWith('/student') || 
                      location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/lecturer') || 
                      location.pathname.startsWith('/finance') || 
                      location.pathname.startsWith('/faculty-officer') || 
                      location.pathname.startsWith('/college-officer') ||
                      location.pathname === '/dashboard';

  // Don't show footer on authenticated routes
  if (isAuthRoute && isAuthenticated) {
    return null;
  }

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">SNU Portal</h3>
            <p className="text-gray-400 text-sm">
              Empowering education through comprehensive student learning and management.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition duration-150">
                  About
                </Link>
              </li>
              <li>
                <Link to="/faculties" className="text-gray-400 hover:text-white transition duration-150">
                  Faculties
                </Link>
              </li>
              <li>
                <Link to="/colleges" className="text-gray-400 hover:text-white transition duration-150">
                  Colleges
                </Link>
              </li>
              <li>
                <Link to="/admissions" className="text-gray-400 hover:text-white transition duration-150">
                  Admissions
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/news" className="text-gray-400 hover:text-white transition duration-150">
                  News
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition duration-150">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-white transition duration-150">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-white transition duration-150">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>info@snu.edu.so</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span>+252 61 234 5678</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>Mogadishu, Somalia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Somali National University. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;