import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';

const loginSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(60, 'Full name cannot exceed 60 characters'),
  userId: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'User ID must be at least 3 characters')
    .max(30, 'User ID cannot exceed 30 characters')
    .regex(/^[a-z0-9._-]+$/, 'User ID can only contain letters, numbers, dots, hyphens and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
});

export function Login() {
  const { user, login, register: registerUser, needsSetup, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register: formRegister,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(isRegisterMode ? registerSchema : loginSchema)
  });

  if (loading) {
    return <div className="state-loading">Checking session...</div>;
  }

  if (needsSetup) {
    return <Navigate to="/setup" replace />;
  }

  if (user) {
    if (user.mustChangePassword) {
      return <Navigate to="/account" replace />;
    }
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  async function onSubmit(data) {
    try {
      setServerError(null);
      if (isRegisterMode) {
        const registeredUser = await registerUser(data);
        if (registeredUser.mustChangePassword) {
          navigate('/account');
        } else {
          const from = location.state?.from?.pathname || '/';
          navigate(from);
        }
      } else {
        const loggedUser = await login(data);
        if (loggedUser.mustChangePassword) {
          navigate('/account');
        } else {
          const from = location.state?.from?.pathname || '/';
          navigate(from);
        }
      }
    } catch (err) {
      setServerError(err.message || (isRegisterMode ? 'Account creation failed.' : 'Login failed.'));
    }
  }

  function toggleMode() {
    setIsRegisterMode(!isRegisterMode);
    setServerError(null);
    reset();
  }

  return (
    <div className="auth-page">
      <div className="auth-form-card">
        <div className="auth-header">
          <div className="wordmark">Sourcing CRM</div>
          <div className="auth-subtitle">
            {isRegisterMode
              ? 'Create a new manager account.'
              : 'Sign in to your sourcing register.'}
          </div>
        </div>

        {serverError && <div className="state-error">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {isRegisterMode && (
            <div className="form-group">
              <label className="form-label" htmlFor="displayName">
                Full name
              </label>
              <input
                id="displayName"
                type="text"
                className="form-input"
                autoComplete="name"
                placeholder="e.g. Vikram Malhotra"
                {...formRegister('displayName')}
              />
              {errors.displayName && (
                <span className="form-error">{errors.displayName.message}</span>
              )}
            </div>
          )}

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
              placeholder="e.g. vikram.m"
              {...formRegister('userId')}
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
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              placeholder="Minimum 8 characters"
              {...formRegister('password')}
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
            {isSubmitting
              ? isRegisterMode
                ? 'Creating account...'
                : 'Signing in...'
              : isRegisterMode
              ? 'Create account'
              : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--space-16)', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            style={{ border: 'none', textDecoration: 'underline' }}
            onClick={toggleMode}
          >
            {isRegisterMode
              ? 'Already have an account? Sign in'
              : 'Need an account? Create one'}
          </button>
        </div>
      </div>
    </div>
  );
}
