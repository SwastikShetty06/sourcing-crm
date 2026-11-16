import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { LoadingState } from '../components/LoadingState';

export function RequireAuth({ children }) {
  const { user, needsSetup, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState text="Loading application session" fullScreen />;
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
