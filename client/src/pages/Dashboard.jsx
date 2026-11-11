import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSummaryStats } from '../api/stats';
import { formatDate } from '../lib/format';
import { Table } from '../components/Table';

export function Dashboard() {
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: getSummaryStats
  });

  const counts = data?.counts || { in_progress: 0, booked: 0, lost: 0 };
  const overdueClients = data?.overdueClients || [];
  const recentEntries = data?.recentEntries || [];
  const visitsLast7Days = data?.visitsLast7Days || 0;

  const overdueColumns = [
    {
      header: 'Client',
      key: 'clientName',
      render: r => <span style={{ fontWeight: 600 }}>{r.clientName}</span>
    },
    {
      header: 'Source',
      key: 'sourceText'
    },
    {
      header: 'Last sales manager',
      key: 'lastSalesManager'
    },
    {
      header: 'Days overdue',
      key: 'daysSinceLastInteraction',
      render: r => (
        <span className="tabular-nums" style={{ color: 'var(--lost-fg)', fontWeight: 600 }}>
          {r.daysSinceLastInteraction} days
        </span>
      )
    }
  ];

  const recentColumns = [
    {
      header: 'Date',
      key: 'occurredAt',
      render: r => <span className="tabular-nums">{formatDate(r.occurredAt)}</span>
    },
    {
      header: 'Client',
      key: 'clientName',
      render: r => <span style={{ fontWeight: 600 }}>{r.clientName}</span>
    },
    {
      header: 'Interaction',
      key: 'kind',
      render: r => r.kind.replace('_', ' ')
    },
    {
      header: 'Sales manager',
      key: 'salesManager'
    },
    {
      header: 'Feedback snippet',
      key: 'feedbackSnippet',
      render: r => <span style={{ color: 'var(--muted)' }}>{r.feedbackSnippet}</span>
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-24)', flexWrap: 'wrap', gap: 'var(--space-12)' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Register dashboard</h1>
          <div className="text-meta" style={{ marginTop: 'var(--space-4)' }}>
            <span className="tabular-nums">{visitsLast7Days}</span> interactions recorded in the last 7 days.
          </div>
        </div>

        <Link to="/clients/new" className="btn btn-primary btn-small">
          + New visit
        </Link>
      </div>

      {isLoading && <div className="state-loading">Loading summary metrics...</div>}
      {isError && (
        <div className="state-error">
          {error?.message || 'Failed to load dashboard metrics.'}
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
          {/* Ledger Strip (single row divided by hairlines) */}
          <div className="ledger-strip">
            <div className="ledger-item">
              <div className="ledger-number tabular-nums" style={{ color: 'var(--progress-fg)' }}>
                {counts.in_progress}
              </div>
              <div className="ledger-label">In progress</div>
            </div>

            <div className="ledger-item">
              <div className="ledger-number tabular-nums" style={{ color: 'var(--booked-fg)' }}>
                {counts.booked}
              </div>
              <div className="ledger-label">Booked</div>
            </div>

            <div className="ledger-item">
              <div className="ledger-number tabular-nums" style={{ color: 'var(--lost-fg)' }}>
                {counts.lost}
              </div>
              <div className="ledger-label">Lost</div>
            </div>
          </div>

          {/* Section: Needs a follow-up */}
          <div style={{ marginBottom: 'var(--space-32)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: 'var(--space-12)' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Needs a follow-up</h2>
              <span className="text-meta tabular-nums">
                {overdueClients.length} clients with no interaction for 7+ days
              </span>
            </div>

            <Table
              columns={overdueColumns}
              data={overdueClients}
              onRowClick={r => navigate(`/clients/${r.id}`)}
              emptyMessage="Nothing is overdue."
            />
          </div>

          {/* Section: Recent entries */}
          <div style={{ marginBottom: 'var(--space-32)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: 'var(--space-12)' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Recent entries</h2>
              <span className="text-meta">Last 10 recorded interactions</span>
            </div>

            <Table
              columns={recentColumns}
              data={recentEntries}
              onRowClick={r => navigate(`/clients/${r.clientId}`)}
              emptyMessage="No interactions recorded yet."
            />
          </div>
        </>
      )}
    </div>
  );
}
