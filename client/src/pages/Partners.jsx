import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPartnerStats } from '../api/stats';
import { updateLookup, mergeLookup } from '../api/lookups';
import { useAuth } from '../auth/AuthContext';
import { Table } from '../components/Table';
import { Edit2, GitMerge, PowerOff, CheckCircle } from 'lucide-react';

const TABS = [
  { key: 'cp_firm', label: 'CP Firms' },
  { key: 'cp', label: 'Channel Partners' },
  { key: 'caller', label: 'Callers' },
  { key: 'sales_manager', label: 'Sales Managers' }
];

export function Partners() {
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('cp_firm');
  const [renameTarget, setRenameTarget] = useState(null);
  const [newName, setNewName] = useState('');
  const [mergeTarget, setMergeTarget] = useState(null);
  const [mergeIntoId, setMergeIntoId] = useState('');
  const [actionError, setActionError] = useState(null);

  const { data: partners = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['stats', 'partners', activeTab],
    queryFn: () => getPartnerStats(activeTab)
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }) => updateLookup(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats', 'partners'] });
      queryClient.invalidateQueries({ queryKey: ['lookups'] });
      setRenameTarget(null);
      setNewName('');
      setActionError(null);
    },
    onError: err => {
      setActionError(err.message || 'Failed to rename option.');
    }
  });

  const mergeMutation = useMutation({
    mutationFn: ({ id, intoId }) => mergeLookup(id, intoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats', 'partners'] });
      queryClient.invalidateQueries({ queryKey: ['lookups'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'summary'] });
      setMergeTarget(null);
      setMergeIntoId('');
      setActionError(null);
    },
    onError: err => {
      setActionError(err.message || 'Failed to merge option.');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateLookup(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats', 'partners'] });
      queryClient.invalidateQueries({ queryKey: ['lookups'] });
      setActionError(null);
    },
    onError: err => {
      setActionError(err.message || 'Failed to update active state.');
    }
  });

  function startRename(row) {
    setRenameTarget(row);
    setNewName(row.name);
    setMergeTarget(null);
    setActionError(null);
  }

  function startMerge(row) {
    setMergeTarget(row);
    setRenameTarget(null);
    setMergeIntoId('');
    setActionError(null);
  }

  function handleSaveRename(e) {
    e.preventDefault();
    if (!newName.trim() || newName.trim().length < 2) {
      setActionError('Name must be at least 2 characters.');
      return;
    }
    renameMutation.mutate({ id: renameTarget.id, name: newName.trim() });
  }

  function handleConfirmMerge(e) {
    e.preventDefault();
    if (!mergeIntoId) {
      setActionError('Please select a target to merge into.');
      return;
    }
    const targetItem = partners.find(p => p.id === mergeIntoId);
    const targetName = targetItem ? targetItem.name : 'selected item';
    if (
      !window.confirm(
        `Are you sure you want to merge "${mergeTarget.name}" into "${targetName}"? All ${mergeTarget.total} client references will move permanently.`
      )
    ) {
      return;
    }
    mergeMutation.mutate({ id: mergeTarget.id, intoId: mergeIntoId });
  }

  function handleToggleActive(row) {
    const nextState = !row.isActive;
    const actionWord = nextState ? 'reactivate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionWord} "${row.name}"?`)) {
      return;
    }
    toggleActiveMutation.mutate({ id: row.id, isActive: nextState });
  }

  // Available merge targets: exclude the item itself and inactive items
  const mergeCandidates = partners.filter(p => {
    if (p.id === mergeTarget?.id) return false;
    if (!p.isActive) return false;
    if (activeTab === 'cp') {
      return p.firmName === mergeTarget?.firmName;
    }
    return true;
  });

  const columns = [
    {
      header: 'Name',
      key: 'name',
      render: r => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{r.name}</span>
            {!r.isActive && (
              <span className="text-meta" style={{ color: 'var(--lost-fg)', fontSize: '11px' }}>
                (inactive)
              </span>
            )}
          </div>
          {activeTab === 'cp' && r.firmName && (
            <div className="text-meta">Firm: {r.firmName}</div>
          )}
        </div>
      )
    },
    {
      header: 'Total clients',
      key: 'total',
      render: r => <span className="tabular-nums">{r.total}</span>
    },
    {
      header: 'In progress',
      key: 'in_progress',
      render: r => <span className="tabular-nums">{r.in_progress}</span>
    },
    {
      header: 'Booked',
      key: 'booked',
      render: r => (
        <span className="tabular-nums" style={{ color: 'var(--booked-fg)', fontWeight: 600 }}>
          {r.booked}
        </span>
      )
    },
    {
      header: 'Lost',
      key: 'lost',
      render: r => <span className="tabular-nums">{r.lost}</span>
    },
    {
      header: 'Conversion',
      key: 'conversion',
      render: r => <span className="tabular-nums">{r.conversion}%</span>
    }
  ];

  if (isAdmin) {
    columns.push({
      header: 'Actions',
      key: 'actions',
      render: r => (
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            style={{ padding: '0 8px', height: '28px', minHeight: '28px' }}
            onClick={e => {
              e.stopPropagation();
              startRename(r);
            }}
            title="Rename"
          >
            <Edit2 size={13} strokeWidth={1.5} />
            <span>Rename</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-small"
            style={{ padding: '0 8px', height: '28px', minHeight: '28px' }}
            onClick={e => {
              e.stopPropagation();
              startMerge(r);
            }}
            title="Merge"
          >
            <GitMerge size={13} strokeWidth={1.5} />
            <span>Merge</span>
          </button>

          <button
            type="button"
            className={`btn ${r.isActive ? 'btn-destructive' : 'btn-secondary'} btn-small`}
            style={{ padding: '0 8px', height: '28px', minHeight: '28px' }}
            onClick={e => {
              e.stopPropagation();
              handleToggleActive(r);
            }}
            title={r.isActive ? 'Deactivate' : 'Reactivate'}
          >
            {r.isActive ? <PowerOff size={13} strokeWidth={1.5} /> : <CheckCircle size={13} strokeWidth={1.5} />}
            <span>{r.isActive ? 'Deactivate' : 'Reactivate'}</span>
          </button>
        </div>
      )
    });
  }

  return (
    <div>
      <h1 className="page-title">Partners & managers</h1>

      {actionError && <div className="state-error">{actionError}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', borderBottom: '1px solid var(--hairline)', marginBottom: 'var(--space-16)', overflowX: 'auto' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className="btn btn-secondary btn-small"
              style={{
                borderRadius: '4px 4px 0 0',
                borderBottom: isActive ? '2px solid var(--accent)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--surface)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--ink)' : 'var(--muted)'
              }}
              onClick={() => {
                setActiveTab(tab.key);
                setRenameTarget(null);
                setMergeTarget(null);
                setActionError(null);
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Inline Rename Panel */}
      {renameTarget && (
        <div className="inline-panel" style={{ marginBottom: 'var(--space-16)' }}>
          <h3 style={{ fontSize: '15px', marginBottom: 'var(--space-8)' }}>
            Rename "{renameTarget.name}"
          </h3>
          <form onSubmit={handleSaveRename} style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ maxWidth: '300px' }}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Enter new name"
            />
            <button
              type="submit"
              className="btn btn-primary btn-small"
              disabled={renameMutation.isPending}
            >
              {renameMutation.isPending ? 'Saving...' : 'Save name'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setRenameTarget(null)}
              disabled={renameMutation.isPending}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Inline Merge Panel */}
      {mergeTarget && (
        <div className="inline-panel" style={{ marginBottom: 'var(--space-16)' }}>
          <h3 style={{ fontSize: '15px', marginBottom: 'var(--space-8)' }}>
            Merge "{mergeTarget.name}" into another option
          </h3>
          <div className="text-meta" style={{ marginBottom: 'var(--space-12)' }}>
            Moving <strong>{mergeTarget.total}</strong> client records. The source "{mergeTarget.name}" will be deactivated.
          </div>

          <form onSubmit={handleConfirmMerge} style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ maxWidth: '300px' }}
              value={mergeIntoId}
              onChange={e => setMergeIntoId(e.target.value)}
            >
              <option value="">Select target option</option>
              {mergeCandidates.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {activeTab === 'cp' && c.firmName ? `(${c.firmName})` : ''}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="btn btn-primary btn-small"
              disabled={mergeMutation.isPending || !mergeIntoId}
            >
              {mergeMutation.isPending ? 'Merging...' : 'Confirm merge'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setMergeTarget(null)}
              disabled={mergeMutation.isPending}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {isLoading && <div className="state-loading">Loading partner statistics...</div>}
      {isError && (
        <div className="state-error">
          {error?.message || 'Failed to load partners.'}
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
          data={partners}
          emptyMessage="No partners recorded for this category."
        />
      )}
    </div>
  );
}
