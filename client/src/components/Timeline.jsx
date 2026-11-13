import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '../lib/format';
import { CreatableSelect } from './CreatableSelect';

const KIND_LABELS = {
  site_visit: 'Site visit',
  revisit: 'Revisit',
  call: 'Call',
  vc: 'VC',
  obm: 'OBM',
  other: 'Other'
};

export function Timeline({
  interactions = [],
  currentUser,
  onUpdateInteraction,
  onDeleteInteraction
}) {
  const [editingId, setEditingId] = useState(null);
  const [editKind, setEditKind] = useState('site_visit');
  const [editDate, setEditDate] = useState('');
  const [editSalesManager, setEditSalesManager] = useState(null);
  const [editFeedback, setEditFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Chronological order: oldest first
  const sorted = [...interactions].sort(
    (a, b) => new Date(a.occurredAt) - new Date(b.occurredAt)
  );

  function startEdit(item) {
    setEditingId(item._id);
    setEditKind(item.kind || 'site_visit');
    const dt = item.occurredAt ? new Date(item.occurredAt).toISOString().split('T')[0] : '';
    setEditDate(dt);
    setEditSalesManager({
      id: item.salesManager?._id || item.salesManager?.id || item.salesManager,
      name: item.salesManager?.name || ''
    });
    setEditFeedback(item.feedback || '');
    setActionError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setActionError(null);
  }

  async function handleSaveEdit(interactionId) {
    if (!editFeedback.trim() || editFeedback.trim().length < 3) {
      setActionError('Feedback must be at least 3 characters.');
      return;
    }
    if (!editSalesManager || (!editSalesManager.id && !editSalesManager.name)) {
      setActionError('Sales manager is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);
      await onUpdateInteraction(interactionId, {
        kind: editKind,
        occurredAt: editDate ? new Date(editDate).toISOString() : undefined,
        salesManager: editSalesManager,
        feedback: editFeedback.trim()
      });
      setEditingId(null);
    } catch (err) {
      setActionError(err.message || 'Failed to update feedback.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(interactionId) {
    if (interactions.length <= 1) {
      alert('Cannot delete the only interaction for a client.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      setActionError(null);
      await onDeleteInteraction(interactionId);
    } catch (err) {
      setActionError(err.message || 'Failed to delete interaction.');
    }
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="timeline-list">
      {actionError && <div className="state-error">{actionError}</div>}

      {sorted.map((item, index) => {
        const itemCreatorId = item.createdBy?._id || item.createdBy?.id || item.createdBy;
        const currentUserId = currentUser?._id || currentUser?.id;
        const canManage = isAdmin || (itemCreatorId && currentUserId && itemCreatorId.toString() === currentUserId.toString());
        const isEditing = editingId === item._id;

        return (
          <div key={item._id} className="timeline-item">
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 140px' }}>
                    <label className="form-label">Interaction type</label>
                    <select
                      className="form-select"
                      value={editKind}
                      onChange={e => setEditKind(e.target.value)}
                    >
                      <option value="site_visit">Site visit</option>
                      <option value="revisit">Revisit</option>
                      <option value="call">Call</option>
                      <option value="vc">VC</option>
                      <option value="obm">OBM</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div style={{ flex: '1 1 140px' }}>
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                    />
                  </div>

                  <div style={{ flex: '1 1 200px' }}>
                    <CreatableSelect
                      label="Sales manager"
                      type="sales_manager"
                      value={editSalesManager}
                      onChange={setEditSalesManager}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Feedback</label>
                  <textarea
                    className="form-textarea"
                    value={editFeedback}
                    maxLength={2000}
                    onChange={e => setEditFeedback(e.target.value)}
                  />
                  <div className="text-meta" style={{ textAlign: 'right' }}>
                    {editFeedback.length}/2000
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    onClick={() => handleSaveEdit(item._id)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={cancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="timeline-header">
                  <div className="timeline-header-info">
                    <span className="timeline-title">Feedback {index + 1}</span>
                    <span className="text-meta" style={{ fontWeight: 500 }}>
                      ({KIND_LABELS[item.kind] || item.kind})
                    </span>
                    <span className="text-meta tabular-nums">{formatDate(item.occurredAt)}</span>
                  </div>

                  {canManage && (
                    <div className="timeline-header-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        onClick={() => startEdit(item)}
                        aria-label="Edit feedback"
                        title="Edit feedback"
                      >
                        <Edit2 size={13} strokeWidth={1.5} />
                      </button>

                      {interactions.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-destructive btn-icon"
                          onClick={() => handleDelete(item._id)}
                          aria-label="Delete feedback"
                          title="Delete feedback"
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="timeline-feedback">{item.feedback}</div>

                <div className="timeline-meta">
                  Attended by <strong>{item.salesManager?.name || 'Unassigned'}</strong>
                  {item.createdBy?.displayName && (
                    <span> - entered by {item.createdBy.displayName}</span>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
