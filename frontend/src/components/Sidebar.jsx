import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const role = localStorage.getItem('role');

  const studentLinks = [
    { path: '/student/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/student/profile', icon: '👤', label: 'Profile' },
    { path: '/student/my-units', icon: '📚', label: 'My Units' },
    { path: '/student/register-semester', icon: '📝', label: 'Register Semester' },
    { path: '/student/register-units', icon: '📋', label: 'Register Units' },
    { path: '/student/payments', icon: '💰', label: 'Payments' },
    { path: '/student/fee-structure', icon: '💳', label: 'Fee Structure' },
    { path: '/student/results', icon: '📊', label: 'Results' },
    { path: '/student/exam-card', icon: '🎫', label: 'Exam Cards' },
    { path: '/student/student-card', icon: '🪪', label: 'Student Card' },
  ];

  const adminLinks = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/users', icon: '👥', label: 'Users' },
    { path: '/admin/colleges', icon: '🏛️', label: 'Colleges' },
    { path: '/admin/faculties', icon: '📚', label: 'Faculties' },
    { path: '/admin/departments', icon: '📁', label: 'Departments' },
    { path: '/admin/programmes', icon: '🎓', label: 'Programmes' },
    { path: '/admin/units', icon: '📖', label: 'Units' },
    { path: '/admin/reports', icon: '📈', label: 'Reports' },
  ];

  const getLinks = () => {
    if (role === 'Student') return studentLinks;
    if (role === 'Admin') return adminLinks;
    // Add more roles as needed
    return studentLinks;
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden" onClick={onClose}></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition duration-200 ease-in-out z-30 md:relative md:flex-shrink-0`}>
        <div className="w-64 h-full bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Menu</h2>
          </div>
          <nav className="mt-4 px-2 space-y-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-4 py-2 rounded-lg transition duration-150 ${
                  location.pathname === link.path
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => {
                  if (window.innerWidth < 768) onClose();
                }}
              >
                <span className="mr-3">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;