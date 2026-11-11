import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RequireAdmin({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="state-loading">Loading application state...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
