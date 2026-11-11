import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getClients } from '../api/clients';
import { getLookups } from '../api/lookups';
import { getUsers } from '../api/users';
import { useAuth } from '../auth/AuthContext';
import { Table } from '../components/Table';
import { StatusChip } from '../components/StatusChip';
import { formatDate } from '../lib/format';
import { exportClientsToExcel } from '../lib/exportExcel';
import { Download, PlusCircle, Search, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

export function Clients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  // Filters state
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [cpFirm, setCpFirm] = useState('');
  const [cp, setCp] = useState('');
  const [caller, setCaller] = useState('');
  const [salesManager, setSalesManager] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [sortBy, setSortBy] = useState('lastInteractionAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const limit = 25;

  // Fetch lookups for filters
  const { data: firms = [] } = useQuery({
    queryKey: ['lookups', 'cp_firm', null],
    queryFn: () => getLookups({ type: 'cp_firm' })
  });

  const { data: cps = [] } = useQuery({
    queryKey: ['lookups', 'cp', cpFirm || null],
    queryFn: () => getLookups({ type: 'cp', parentId: cpFirm || undefined }),
    enabled: Boolean(cpFirm)
  });

  const { data: callers = [] } = useQuery({
    queryKey: ['lookups', 'caller', null],
    queryFn: () => getLookups({ type: 'caller' })
  });

  const { data: salesManagers = [] } = useQuery({
    queryKey: ['lookups', 'sales_manager', null],
    queryFn: () => getLookups({ type: 'sales_manager' })
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: isAdmin
  });

  // Query clients
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'clients',
      { q, status, leadSource, cpFirm, cp, caller, salesManager, from, to, createdBy, sortBy, sortOrder, page, limit }
    ],
    queryFn: () =>
      getClients({
        q,
        status,
        leadSource,
        cpFirm,
        cp,
        caller,
        salesManager,
        from,
        to,
        createdBy,
        sortBy,
        sortOrder,
        page,
        limit
      })
  });

  const clients = data?.clients || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;
  const fromRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const toRecord = Math.min(page * limit, total);

  function resetFilters() {
    setQ('');
    setStatus('');
    setLeadSource('');
    setCpFirm('');
    setCp('');
    setCaller('');
    setSalesManager('');
    setFrom('');
    setTo('');
    setCreatedBy('');
    setSortBy('lastInteractionAt');
    setSortOrder('desc');
    setPage(1);
  }

  async function handleExportExcel() {
    try {
      setIsExporting(true);
      const exportData = await getClients({
        q,
        status,
        leadSource,
        cpFirm,
        cp,
        caller,
        salesManager,
        from,
        to,
        createdBy,
        page: 1,
        limit: 5000
      });

      const recordsToExport = exportData?.clients || [];
      exportClientsToExcel(recordsToExport, 'Sourcing_CRM_Clients.csv');
    } catch (err) {
      alert(err.message || 'Failed to export client data.');
    } finally {
      setIsExporting(false);
    }
  }

  function renderSource(c) {
    const firmName = c.cpFirm?.name || 'CP Firm';
    const cpName = c.cp?.name || 'CP';
    let sub = '';
    if (c.leadSource === 'calling') {
      sub = c.caller?.name ? `via Calling (${c.caller.name})` : 'via Calling';
    } else {
      sub = 'via Reference';
    }

    return (
      <div>
        <div style={{ fontWeight: 600 }}>{firmName}, {cpName}</div>
        <div className="text-meta" style={{ fontSize: '12px' }}>{sub}</div>
      </div>
    );
  }

  const columns = [
    {
      header: 'Client',
      key: 'clientName',
      render: c => (
        <div>
          <div style={{ fontWeight: 600 }}>{c.clientName}</div>
          {c.clientPhone && (
            <div className="text-meta tabular-nums">{c.clientPhone}</div>
          )}
          {c.projectName && (
            <div className="text-meta" style={{ fontStyle: 'italic', fontSize: '12px' }}>
              {c.projectName}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'CP & Source',
      key: 'leadSource',
      render: renderSource
    },
    {
      header: 'Sales manager',
      key: 'lastSalesManager',
      render: c => c.lastSalesManager?.name || 'Unassigned'
    },
    {
      header: 'Interactions',
      key: 'interactions',
      render: c => (
        <span className="tabular-nums">
          {c.interactions?.length || 0}
        </span>
      )
    },
    {
      header: 'Last interaction',
      key: 'lastInteractionAt',
      render: c => (
        <span className="tabular-nums">
          {formatDate(c.lastInteractionAt || c.firstVisitDate)}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: c => <StatusChip status={c.status} />
    }
  ];

  const hasActiveFilters = Boolean(
    q || status || leadSource || cpFirm || cp || caller || salesManager || from || to || createdBy || sortBy !== 'lastInteractionAt' || sortOrder !== 'desc'
  );

  const secondaryFilterCount = [cpFirm, cp, caller, salesManager, createdBy, from, to].filter(Boolean).length;

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-20)', flexWrap: 'wrap', gap: 'var(--space-12)' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Client register</h1>
          <div className="text-meta" style={{ marginTop: 'var(--space-4)' }}>
            All visits provided by Channel Partners.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleExportExcel}
            disabled={isExporting || total === 0}
            title="Download records in Excel / CSV format"
          >
            <Download size={14} strokeWidth={1.5} />
            <span>{isExporting ? 'Exporting...' : 'Export to Excel'}</span>
          </button>

          <Link to="/clients/new" className="btn btn-primary btn-small">
            <PlusCircle size={14} strokeWidth={1.5} />
            <span>New visit</span>
          </Link>
        </div>
      </div>

      {/* Structured Filter Card */}
      <div style={{ marginBottom: 'var(--space-20)', padding: 'var(--space-16)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-input)', backgroundColor: 'var(--surface)' }}>
        {/* Row 1: Fast Search & Status / Source Segmentation */}
        <div style={{ display: 'flex', gap: 'var(--space-12)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-16)' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by client name or mobile..."
              value={q}
              onChange={e => {
                setQ(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '34px' }}
            />
            <Search
              size={15}
              strokeWidth={1.5}
              style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--muted)' }}
            />
          </div>

          {/* Quick status tabs */}
          <div style={{ display: 'inline-flex', background: 'var(--paper)', padding: '3px', borderRadius: '4px', border: '1px solid var(--hairline)' }}>
            {[
              { val: '', label: 'All status' },
              { val: 'in_progress', label: 'In progress' },
              { val: 'booked', label: 'Booked' },
              { val: 'lost', label: 'Lost' }
            ].map(tab => (
              <button
                key={tab.val}
                type="button"
                className="btn-small"
                style={{
                  border: 'none',
                  background: status === tab.val ? 'var(--surface)' : 'transparent',
                  color: status === tab.val ? 'var(--ink)' : 'var(--muted)',
                  fontWeight: status === tab.val ? 600 : 500,
                  borderRadius: '3px',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  fontSize: '12px'
                }}
                onClick={() => {
                  setStatus(tab.val);
                  setPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick source tabs */}
          <div style={{ display: 'inline-flex', background: 'var(--paper)', padding: '3px', borderRadius: '4px', border: '1px solid var(--hairline)' }}>
            {[
              { val: '', label: 'All sources' },
              { val: 'calling', label: 'Calling' },
              { val: 'reference', label: 'Reference' }
            ].map(tab => (
              <button
                key={tab.val}
                type="button"
                className="btn-small"
                style={{
                  border: 'none',
                  background: leadSource === tab.val ? 'var(--surface)' : 'transparent',
                  color: leadSource === tab.val ? 'var(--ink)' : 'var(--muted)',
                  fontWeight: leadSource === tab.val ? 600 : 500,
                  borderRadius: '3px',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  fontSize: '12px'
                }}
                onClick={() => {
                  setLeadSource(tab.val);
                  setPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile filter toggle bar */}
        <div className="mobile-filter-toggle">
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <SlidersHorizontal size={13} strokeWidth={1.5} />
            <span>{showMobileFilters ? 'Hide filters' : 'More filters'}</span>
            {secondaryFilterCount > 0 && (
              <span style={{ background: 'var(--accent)', color: '#fff', fontSize: '11px', padding: '1px 6px', borderRadius: '10px' }}>
                {secondaryFilterCount}
              </span>
            )}
            {showMobileFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              className="text-meta"
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              onClick={resetFilters}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Row 2: Secondary dropdowns in an aligned grid */}
        <div className={`mobile-filter-drawer ${showMobileFilters ? '' : 'collapsed'}`}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="filter-firm">CP firm</label>
            <select
              id="filter-firm"
              className="form-select"
              value={cpFirm}
              onChange={e => {
                setCpFirm(e.target.value);
                setCp('');
                setPage(1);
              }}
            >
              <option value="">All firms</option>
              {firms.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="filter-cp">Channel Partner</label>
            <select
              id="filter-cp"
              className="form-select"
              value={cp}
              disabled={!cpFirm}
              onChange={e => {
                setCp(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{cpFirm ? 'All CPs in firm' : 'Select firm first'}</option>
              {cps.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="filter-caller">Caller (Calling only)</label>
            <select
              id="filter-caller"
              className="form-select"
              value={caller}
              disabled={leadSource === 'reference'}
              onChange={e => {
                setCaller(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{leadSource === 'reference' ? 'Not applicable' : 'All callers'}</option>
              {callers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="filter-sm">Sales manager</label>
            <select
              id="filter-sm"
              className="form-select"
              value={salesManager}
              onChange={e => {
                setSalesManager(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All sales managers</option>
              {salesManagers.map(sm => (
                <option key={sm.id} value={sm.id}>{sm.name}</option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="filter-user">Logged by manager</label>
              <select
                id="filter-user"
                className="form-select"
                value={createdBy}
                onChange={e => {
                  setCreatedBy(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All team managers</option>
                {users.map(u => (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    {u.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="filter-sort">Sort order</label>
            <select
              id="filter-sort"
              className="form-select"
              value={`${sortBy}:${sortOrder}`}
              onChange={e => {
                const [sb, so] = e.target.value.split(':');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
            >
              <option value="lastInteractionAt:desc">Last interaction (Newest first)</option>
              <option value="lastInteractionAt:asc">Last interaction (Oldest first)</option>
              <option value="firstVisitDate:desc">Visited date (Newest first)</option>
              <option value="firstVisitDate:asc">Visited date (Oldest first)</option>
              <option value="clientName:asc">Client name (A to Z)</option>
              <option value="clientName:desc">Client name (Z to A)</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div style={{ marginTop: 'var(--space-12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-8)' }}>
            <span className="text-meta tabular-nums">
              Filters active. Found {total} matching records.
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={resetFilters}
            >
              <RotateCcw size={12} strokeWidth={1.5} />
              <span>Reset filters</span>
            </button>
          </div>
        )}
      </div>

      {isLoading && <div className="state-loading">Loading clients...</div>}
      {isError && (
        <div className="state-error">
          {error?.message || 'Failed to load client records.'}
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
        <>
          <Table
            columns={columns}
            data={clients}
            onRowClick={c => navigate(`/clients/${c._id || c.id}`)}
            emptyMessage={
              hasActiveFilters
                ? 'No clients match these filters.'
                : 'No clients yet. Add the first visit.'
            }
          />

          {total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-12)', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
              <div className="text-meta tabular-nums">
                Showing {fromRecord} to {toRecord} of {total} clients
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
