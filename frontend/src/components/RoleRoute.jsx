import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const role = localStorage.getItem('role');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default RoleRoute;