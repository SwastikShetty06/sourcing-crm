import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { setupAdmin } from '../api/auth';
import { useAuth } from '../auth/AuthContext';

const setupSchema = z.object({
  userId: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'User ID must be at least 3 characters')
    .max(30, 'User ID cannot exceed 30 characters')
    .regex(/^[a-z0-9._-]+$/, 'User ID can only contain letters, numbers, dots, hyphens and underscores'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
});

export function Setup() {
  const { needsSetup, setNeedsSetup, setUser, loading } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(setupSchema)
  });

  if (loading) {
    return <div className="state-loading">Checking configuration...</div>;
  }

  if (needsSetup === false) {
    return <Navigate to="/login" replace />;
  }

  async function onSubmit(data) {
    try {
      setServerError(null);
      const user = await setupAdmin(data);
      setUser(user);
      setNeedsSetup(false);
      navigate('/');
    } catch (err) {
      setServerError(err.message || 'Setup request failed.');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-form-card">
        <div className="auth-header">
          <div className="wordmark">Sourcing CRM</div>
          <div className="auth-subtitle">Create the initial administrator account.</div>
        </div>

        {serverError && <div className="state-error">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="displayName">
              Full Name
            </label>
            <input
              id="displayName"
              type="text"
              className="form-input"
              autoComplete="name"
              {...register('displayName')}
            />
            {errors.displayName && (
              <span className="form-error">{errors.displayName.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="userId">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              className="form-input"
              autoComplete="username"
              autoCapitalize="none"
              {...register('userId')}
            />
            {errors.userId && (
              <span className="form-error">{errors.userId.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password && (
              <span className="form-error">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-8)' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create admin account'}
          </button>
        </form>
      </div>
    </div>
  );
}
