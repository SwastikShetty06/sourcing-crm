import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { LoadingState } from '../components/LoadingState';

export function RequireAdmin({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState text="Checking administrator privileges" fullScreen />;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
