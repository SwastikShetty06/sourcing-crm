import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, resetUserPassword } from '../api/users';
import { useAuth } from '../auth/AuthContext';
import { Table } from '../components/Table';
import { formatDate } from '../lib/format';
import { KeyRound, PowerOff, CheckCircle, Copy, Check, Filter } from 'lucide-react';

export function Team() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('manager');
  const [formError, setFormError] = useState(null);

  // Filters & sorting for accounts bifurcation
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('displayName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Temporary password display modal / box
  const [tempPasswordNotice, setTempPasswordNotice] = useState(null);
  const [copied, setCopied] = useState(false);

  // Reset password state
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  const { data: users = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (createdUser, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowAddForm(false);
      setNewUserId('');
      setNewDisplayName('');
      setNewPassword('');
      setNewRole('manager');
      setFormError(null);
      setTempPasswordNotice({
        userId: createdUser.userId,
        displayName: createdUser.displayName,
        tempPassword: variables.password
      });
    },
    onError: err => {
      setFormError(err.message || 'Failed to create user.');
    }
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateUser(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: err => {
      alert(err.message || 'Failed to update user active status.');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }) => resetUserPassword(id, password),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTempPasswordNotice({
        userId: resetTargetUser.userId,
        displayName: resetTargetUser.displayName,
        tempPassword: variables.password
      });
      setResetTargetUser(null);
      setResetPasswordVal('');
    },
    onError: err => {
      alert(err.message || 'Failed to reset password.');
    }
  });

  function handleCreateUser(e) {
    e.preventDefault();
    setFormError(null);

    const uId = newUserId.trim().toLowerCase();
    const name = newDisplayName.trim();

    if (!uId || uId.length < 3 || uId.length > 30) {
      setFormError('User ID must be between 3 and 30 characters.');
      return;
    }
    if (!/^[a-z0-9._-]+$/.test(uId)) {
      setFormError('User ID can only contain letters, numbers, dots, hyphens and underscores.');
      return;
    }
    if (!name || name.length < 2) {
      setFormError('Name must be at least 2 characters.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setFormError('Temporary password must be at least 8 characters.');
      return;
    }

    createUserMutation.mutate({
      userId: uId,
      displayName: name,
      password: newPassword,
      role: newRole
    });
  }

  function handleToggleActive(user) {
    if (user._id === currentUser._id || user.id === currentUser.id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    const nextState = !user.isActive;
    const actionWord = nextState ? 'reactivate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionWord} user "${user.displayName}"?`)) {
      return;
    }
    toggleUserActiveMutation.mutate({
      id: user._id || user.id,
      isActive: nextState
    });
  }

  function handleResetPasswordSubmit(e) {
    e.preventDefault();
    if (!resetPasswordVal || resetPasswordVal.length < 8) {
      alert('Temporary password must be at least 8 characters.');
      return;
    }
    resetPasswordMutation.mutate({
      id: resetTargetUser._id || resetTargetUser.id,
      password: resetPasswordVal
    });
  }

  function copyTempPassword() {
    if (tempPasswordNotice?.tempPassword) {
      navigator.clipboard.writeText(tempPasswordNotice.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function generateRandomPassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  // Filtered and sorted accounts list
  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        u => u.displayName.toLowerCase().includes(q) || u.userId.toLowerCase().includes(q)
      );
    }

    if (roleFilter) {
      list = list.filter(u => u.role === roleFilter);
    }

    if (statusFilter !== '') {
      const isActive = statusFilter === 'active';
      list = list.filter(u => u.isActive === isActive);
    }

    list.sort((a, b) => {
      let fieldA = a[sortBy] || '';
      let fieldB = b[sortBy] || '';

      if (sortBy === 'lastLoginAt' || sortBy === 'createdAt') {
        fieldA = fieldA ? new Date(fieldA).getTime() : 0;
        fieldB = fieldB ? new Date(fieldB).getTime() : 0;
      } else if (typeof fieldA === 'string') {
        fieldA = fieldA.toLowerCase();
        fieldB = fieldB.toLowerCase();
      }

      if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  const columns = [
    {
      header: 'User ID',
      key: 'userId',
      render: u => <span style={{ fontWeight: 600 }}>{u.userId}</span>
    },
    {
      header: 'Name',
      key: 'displayName',
      render: u => u.displayName
    },
    {
      header: 'Role',
      key: 'role',
      render: u => (u.role === 'admin' ? 'Administrator' : 'Sourcing Manager')
    },
    {
      header: 'Status',
      key: 'isActive',
      render: u => (
        <span
          className="status-chip"
          style={{
            backgroundColor: u.isActive ? 'var(--booked-bg)' : 'var(--lost-bg)',
            color: u.isActive ? 'var(--booked-fg)' : 'var(--lost-fg)'
          }}
        >
          {u.isActive ? 'Active' : 'Deactivated'}
        </span>
      )
    },
    {
      header: 'Last login',
      key: 'lastLoginAt',
      render: u => (
        <span className="tabular-nums">
          {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never logged in'}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: u => {
        const isSelf = u._id === currentUser._id || u.id === currentUser.id;
        return (
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              style={{ padding: '0 8px', height: '28px', minHeight: '28px' }}
              onClick={() => {
                setResetTargetUser(u);
                setResetPasswordVal(generateRandomPassword());
              }}
              title="Reset password"
            >
              <KeyRound size={13} strokeWidth={1.5} />
              <span>Reset</span>
            </button>

            {!isSelf && (
              <button
                type="button"
                className={`btn ${u.isActive ? 'btn-destructive' : 'btn-secondary'} btn-small`}
                style={{ padding: '0 8px', height: '28px', minHeight: '28px' }}
                onClick={() => handleToggleActive(u)}
                title={u.isActive ? 'Deactivate' : 'Reactivate'}
              >
                {u.isActive ? <PowerOff size={13} strokeWidth={1.5} /> : <CheckCircle size={13} strokeWidth={1.5} />}
                <span>{u.isActive ? 'Deactivate' : 'Reactivate'}</span>
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-20)', flexWrap: 'wrap', gap: 'var(--space-12)' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Team management</h1>
          <div className="text-meta" style={{ marginTop: 'var(--space-4)' }}>
            Manage sourcing managers and system administrators.
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) {
              setNewPassword(generateRandomPassword());
            }
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add user'}
        </button>
      </div>

      {/* Temporary Password Callout Box */}
      {tempPasswordNotice && (
        <div
          style={{
            padding: 'var(--space-16)',
            backgroundColor: 'var(--surface)',
            border: '2px solid var(--accent)',
            borderRadius: 'var(--radius-input)',
            marginBottom: 'var(--space-24)'
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: 'var(--space-4)' }}>
            Temporary password generated for {tempPasswordNotice.displayName} ({tempPasswordNotice.userId})
          </div>
          <div className="text-meta" style={{ marginBottom: 'var(--space-12)' }}>
            This password will only be shown once. The user will be required to change it upon first login.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
            <input
              type="text"
              readOnly
              className="form-input tabular-nums"
              style={{ maxWidth: '280px', fontWeight: 600, backgroundColor: 'var(--paper)' }}
              value={tempPasswordNotice.tempPassword}
            />
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={copyTempPassword}
            >
              {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setTempPasswordNotice(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <div className="inline-panel" style={{ marginBottom: 'var(--space-24)' }}>
          <h2 style={{ fontSize: '16px', marginBottom: 'var(--space-16)' }}>Add new user</h2>

          {formError && <div className="state-error">{formError}</div>}

          <form onSubmit={handleCreateUser} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-userId">
                  User ID
                  <span className="required-mark">*</span>
                </label>
                <input
                  id="new-userId"
                  type="text"
                  className="form-input"
                  placeholder="e.g. vikram.m"
                  autoCapitalize="none"
                  value={newUserId}
                  onChange={e => setNewUserId(e.target.value.toLowerCase())}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-name">
                  Full name
                  <span className="required-mark">*</span>
                </label>
                <input
                  id="new-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Vikram Malhotra"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-pass">
                  Temporary password
                  <span className="required-mark">*</span>
                </label>
                <input
                  id="new-pass"
                  type="text"
                  className="form-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-role">
                  Role
                </label>
                <select
                  id="new-role"
                  className="form-select"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                >
                  <option value="manager">Sourcing Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-12)' }}>
              <button
                type="submit"
                className="btn btn-primary btn-small"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? 'Creating...' : 'Create user'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setShowAddForm(false)}
                disabled={createUserMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Modal/Panel */}
      {resetTargetUser && (
        <div className="inline-panel" style={{ marginBottom: 'var(--space-24)' }}>
          <h2 style={{ fontSize: '16px', marginBottom: 'var(--space-8)' }}>
            Reset password for {resetTargetUser.displayName} ({resetTargetUser.userId})
          </h2>
          <div className="text-meta" style={{ marginBottom: 'var(--space-12)' }}>
            Set a new temporary password. The user will be required to change it on their next login.
          </div>

          <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ maxWidth: '280px' }}
              value={resetPasswordVal}
              onChange={e => setResetPasswordVal(e.target.value)}
              placeholder="Temporary password"
            />
            <button
              type="submit"
              className="btn btn-primary btn-small"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Save temporary password'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setResetTargetUser(null)}
              disabled={resetPasswordMutation.isPending}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Filter and Sort Toolbar for Account Bifurcation */}
      <div style={{ marginBottom: 'var(--space-16)', padding: 'var(--space-16)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-input)', backgroundColor: 'var(--surface)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-8)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="user-search">Search account</label>
            <input
              id="user-search"
              type="text"
              className="form-input"
              placeholder="Name or User ID"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="user-role-filter">Role filter</label>
            <select
              id="user-role-filter"
              className="form-select"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">All roles</option>
              <option value="manager">Sourcing Managers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="user-status-filter">Status filter</label>
            <select
              id="user-status-filter"
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All accounts</option>
              <option value="active">Active only</option>
              <option value="deactivated">Deactivated only</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="user-sort-by">Sort by</label>
            <select
              id="user-sort-by"
              className="form-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="displayName">Full name</option>
              <option value="userId">User ID</option>
              <option value="lastLoginAt">Last login</option>
              <option value="createdAt">Date added</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="user-sort-order">Order</label>
            <select
              id="user-sort-order"
              className="form-select"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            >
              <option value="asc">Ascending (A to Z / Oldest)</option>
              <option value="desc">Descending (Z to A / Newest)</option>
            </select>
          </div>
        </div>

        {(searchTerm || roleFilter || statusFilter || sortBy !== 'displayName' || sortOrder !== 'asc') && (
          <div style={{ marginTop: 'var(--space-12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-meta tabular-nums">
              Showing {filteredUsers.length} of {users.length} accounts
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setStatusFilter('');
                setSortBy('displayName');
                setSortOrder('asc');
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {isLoading && <div className="state-loading">Loading users...</div>}
      {isError && (
        <div className="state-error">
          {error?.message || 'Failed to load team users.'}
          <button
            type="button"
            className="btn btn-secondary btn-small"
            style={{ marginLeft: 'var(--space-8)' }}
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <Table
          columns={columns}
          data={filteredUsers}
          emptyMessage="No accounts match these filters."
        />
      )}
    </div>
  );
}
