import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RequireAuth({ children }) {
  const { user, needsSetup, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="state-loading">Loading application state...</div>;
  }

  if (needsSetup) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/account') {
    return <Navigate to="/account" replace />;
  }

  return children;
}
