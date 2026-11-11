import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { changePassword } from '../api/auth';
import { useAuth } from '../auth/AuthContext';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password')
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword']
  });

export function Account() {
  const { user, refreshUser } = useAuth();
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(changePasswordSchema)
  });

  async function onSubmit(data) {
    try {
      setServerError(null);
      setSuccessMessage(null);
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      await refreshUser();
      setSuccessMessage('Password changed successfully.');
      reset();
    } catch (err) {
      setServerError(err.message || 'Failed to change password.');
    }
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <h1 className="page-title">Account settings</h1>

      {user?.mustChangePassword && (
        <div className="state-error" style={{ marginBottom: 'var(--space-24)' }}>
          You must change your temporary password before accessing other features.
        </div>
      )}

      <div style={{ marginBottom: 'var(--space-24)', padding: 'var(--space-16)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-input)', backgroundColor: 'var(--surface)' }}>
        <div className="text-meta" style={{ marginBottom: 'var(--space-4)' }}>Account profile</div>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>{user?.displayName}</div>
        <div className="text-meta">User ID: {user?.userId}</div>
        <div className="text-meta">Role: {user?.role === 'admin' ? 'Administrator' : 'Sourcing Manager'}</div>
      </div>

      <div style={{ padding: 'var(--space-24)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-input)', backgroundColor: 'var(--surface)' }}>
        <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-16)' }}>Change password</h2>

        {serverError && <div className="state-error">{serverError}</div>}
        {successMessage && (
          <div
            style={{
              padding: 'var(--space-12) var(--space-16)',
              backgroundColor: 'var(--booked-bg)',
              color: 'var(--booked-fg)',
              borderRadius: 'var(--radius-input)',
              marginBottom: 'var(--space-16)',
              fontSize: '14px'
            }}
          >
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="currentPassword">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              className="form-input"
              autoComplete="current-password"
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <span className="form-error">{errors.currentPassword.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              className="form-input"
              autoComplete="new-password"
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <span className="form-error">{errors.newPassword.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <span className="form-error">{errors.confirmPassword.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-8)' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
