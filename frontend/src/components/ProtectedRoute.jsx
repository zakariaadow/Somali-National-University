import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const role = localStorage.getItem('role');
  
  console.log('🔒 ProtectedRoute check:', { isAuthenticated, role, requiredRole });
  
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && role !== requiredRole) {
    console.log(`❌ Role mismatch. Required: ${requiredRole}, Got: ${role}`);
    return <Navigate to="/login" replace />;
  }
  
  console.log('✅ Access granted');
  return children;
};

export default ProtectedRoute;