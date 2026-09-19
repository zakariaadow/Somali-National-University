import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [state, setState] = useState({
    loading: true,
    isAuthenticated: false,
    role: null,
  });

  useEffect(() => {
    let mounted = true;

    axios
      .get(`${API_BASE_URL}/auth/profile`, { withCredentials: true })
      .then((res) => {
        if (!mounted) return;
        const { user, role } = res.data;

        // Refresh localStorage cache for other components
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('role', role);
        localStorage.setItem('isAuthenticated', 'true');
        if (user?.id) localStorage.setItem('userId', user.id);

        setState({ loading: false, isAuthenticated: true, role });
      })
      .catch(() => {
        if (!mounted) return;
        // Clear stale cache
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userId');
        setState({ loading: false, isAuthenticated: false, role: null });
      });

    return () => { mounted = false; };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && state.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;