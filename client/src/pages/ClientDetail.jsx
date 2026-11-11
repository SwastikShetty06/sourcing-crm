import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClient,
  updateClient,
  addInteraction,
  updateInteraction,
  deleteInteraction,
  updateClientStatus,
  deleteClient,
  archiveClient
} from '../api/clients';
import { useAuth } from '../auth/AuthContext';
import { StatusChip } from '../components/StatusChip';
import { StatusDialog } from '../components/StatusDialog';
import { Timeline } from '../components/Timeline';
import { AddFeedbackForm } from '../components/AddFeedbackForm';
import { CreatableSelect } from '../components/CreatableSelect';
import { SourceSegment } from '../components/SourceSegment';
import { formatDate } from '../lib/format';
import { Edit2, Archive, ArrowLeft, Trash2, Building2, Phone, Calendar, MapPin, UserCheck } from 'lucide-react';

const LOST_REASONS = [
  { value: 'budget', label: 'Budget constraints' },
  { value: 'location', label: 'Location mismatch' },
  { value: 'chose_competitor', label: 'Chose competitor' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'unreachable', label: 'Unreachable' },
  { value: 'other', label: 'Other reason' }
];

export function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Full edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProject, setEditProject] = useState('');
  const [editLeadSource, setEditLeadSource] = useState('calling');
  const [editCpFirm, setEditCpFirm] = useState(null);
  const [editCp, setEditCp] = useState(null);
  const [editCaller, setEditCaller] = useState(null);
  const [editVisitDate, setEditVisitDate] = useState('');
  const [editUnitDetails, setEditUnitDetails] = useState('');
  const [editBookingDate, setEditBookingDate] = useState('');
  const [editLostReason, setEditLostReason] = useState('');
  const [editLostNote, setEditLostNote] = useState('');
  const [editError, setEditError] = useState(null);

  // Status dialog state
  const [dialogStatus, setDialogStatus] = useState(null);

  const {
    data: client,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClient(id)
  });

  const isAdmin = user && user.role === 'admin';
  const isOwner = client && (
    (client.createdBy?._id && user?._id && client.createdBy._id.toString() === user._id.toString()) ||
    (client.createdBy && user?._id && client.createdBy.toString() === user._id.toString())
  );
  const canEdit = isAdmin || isOwner;

  // Mutations
  const updateMutation = useMutation({
    mutationFn: updates => updateClient(id, updates),
    onSuccess: updated => {
      queryClient.setQueryData(['client', id], updated);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setIsEditing(false);
    }
  });

  const statusMutation = useMutation({
    mutationFn: statusData => updateClientStatus(id, statusData),
    onSuccess: updated => {
      queryClient.setQueryData(['client', id], updated);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setDialogStatus(null);
    }
  });

  const addInteractionMutation = useMutation({
    mutationFn: interaction => addInteraction(id, interaction),
    onSuccess: updated => {
      queryClient.setQueryData(['client', id], updated);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  const updateInteractionMutation = useMutation({
    mutationFn: ({ interactionId, data }) => updateInteraction(id, interactionId, data),
    onSuccess: updated => {
      queryClient.setQueryData(['client', id], updated);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  const deleteInteractionMutation = useMutation({
    mutationFn: interactionId => deleteInteraction(id, interactionId),
    onSuccess: updated => {
      queryClient.setQueryData(['client', id], updated);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  function startEdit() {
    setEditName(client.clientName || '');
    setEditPhone(client.clientPhone || '');
    setEditProject(client.projectName || '');
    setEditLeadSource(client.leadSource || 'calling');
    setEditCpFirm(client.cpFirm ? { id: client.cpFirm._id || client.cpFirm.id, name: client.cpFirm.name } : null);
    setEditCp(client.cp ? { id: client.cp._id || client.cp.id, name: client.cp.name } : null);
    setEditCaller(client.caller ? { id: client.caller._id || client.caller.id, name: client.caller.name } : null);
    setEditVisitDate(
      client.firstVisitDate ? new Date(client.firstVisitDate).toISOString().split('T')[0] : ''
    );
    setEditUnitDetails(client.unitDetails || '');
    setEditBookingDate(
      client.bookingDate ? new Date(client.bookingDate).toISOString().split('T')[0] : ''
    );
    setEditLostReason(client.lostReason || '');
    setEditLostNote(client.lostNote || '');
    setEditError(null);
    setIsEditing(true);
  }

  function handleEditFirmChange(newFirm) {
    setEditCpFirm(newFirm);
    setEditCp(null);
  }

  function handleEditSourceChange(newSource) {
    setEditLeadSource(newSource);
    if (newSource === 'reference') {
      setEditCaller(null);
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editName.trim() || editName.trim().length < 2) {
      setEditError('Client name must be at least 2 characters.');
      return;
    }
    if (editPhone.trim() && !/^[0-9]{10}$/.test(editPhone.trim())) {
      setEditError('Phone number must be exactly 10 digits.');
      return;
    }
    if (!editCpFirm || (!editCpFirm.id && !editCpFirm.name)) {
      setEditError('CP firm is required.');
      return;
    }
    if (!editCp || (!editCp.id && !editCp.name)) {
      setEditError('Channel Partner name is required.');
      return;
    }
    if (editLeadSource === 'calling' && (!editCaller || (!editCaller.id && !editCaller.name))) {
      setEditError('Caller is required for Calling source.');
      return;
    }

    try {
      setEditError(null);
      await updateMutation.mutateAsync({
        clientName: editName.trim(),
        clientPhone: editPhone.trim() || null,
        projectName: editProject.trim() || null,
        leadSource: editLeadSource,
        cpFirm: editCpFirm,
        cp: editCp,
        caller: editLeadSource === 'calling' && editCaller && (editCaller.id || editCaller.name) ? editCaller : null,
        firstVisitDate: editVisitDate ? new Date(editVisitDate).toISOString() : undefined,
        unitDetails: editUnitDetails.trim() || null,
        bookingDate: editBookingDate ? new Date(editBookingDate).toISOString() : null,
        lostReason: editLostReason || null,
        lostNote: editLostNote.trim() || null
      });
    } catch (err) {
      setEditError(err.message || 'Failed to update client record.');
    }
  }

  function handleStatusSegmentClick(nextStatus) {
    if (nextStatus === client.status) return;

    if (nextStatus === 'in_progress') {
      statusMutation.mutate({ status: 'in_progress' });
    } else {
      setDialogStatus(nextStatus);
    }
  }

  async function handleDeleteClient() {
    if (!window.confirm(`Are you sure you want to delete "${client.clientName}"? This record and all its feedback entries will be permanently removed.`)) {
      return;
    }
    try {
      await deleteClient(id);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      navigate('/clients');
    } catch (err) {
      alert(err.message || 'Failed to delete client entry.');
    }
  }

  async function handleArchive() {
    if (!window.confirm(`Are you sure you want to archive "${client.clientName}"?`)) {
      return;
    }
    try {
      await archiveClient(id);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      navigate('/clients');
    } catch (err) {
      alert(err.message || 'Failed to archive client.');
    }
  }

  if (isLoading) {
    return <div className="state-loading">Loading client details...</div>;
  }

  if (isError || !client) {
    return (
      <div>
        <div className="state-error">
          {error?.message || 'Client record not found.'}
        </div>
        <Link to="/clients" className="btn btn-secondary btn-small">
          Back to clients
        </Link>
      </div>
    );
  }

  const firmName = client.cpFirm?.name || 'CP Firm';
  const cpName = client.cp?.name || 'Channel Partner';
  const isCalling = client.leadSource === 'calling';
  const callerName = client.caller?.name;

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Top back navigation */}
      <div style={{ marginBottom: 'var(--space-16)' }}>
        <Link to="/clients" className="text-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ArrowLeft size={14} strokeWidth={1.5} />
          <span>Back to client list</span>
        </Link>
      </div>

      {/* Client Header Card */}
      <div style={{ padding: 'var(--space-20)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-input)', backgroundColor: 'var(--surface)', marginBottom: 'var(--space-24)' }}>
        {isEditing ? (
          <form onSubmit={handleSaveEdit} noValidate>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-16)' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Edit client details</h2>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>

            {editError && <div className="state-error">{editError}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="edit-name">
                Client name
                <span className="required-mark">*</span>
              </label>
              <input
                id="edit-name"
                type="text"
                className="form-input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-phone">Mobile number</label>
                <input
                  id="edit-phone"
                  type="tel"
                  className="form-input"
                  maxLength={10}
                  placeholder="10 digits"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-project">Project / site</label>
                <input
                  id="edit-project"
                  type="text"
                  className="form-input"
                  maxLength={80}
                  value={editProject}
                  onChange={e => setEditProject(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-visit-date">Visited date</label>
                <input
                  id="edit-visit-date"
                  type="date"
                  className="form-input"
                  value={editVisitDate}
                  onChange={e => setEditVisitDate(e.target.value)}
                />
              </div>
            </div>

            {/* Source bifurcation */}
            <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-16)', marginTop: 'var(--space-16)' }}>
              <label className="form-label" style={{ marginBottom: 'var(--space-8)', display: 'block' }}>
                Visit source
              </label>
              <div style={{ marginBottom: 'var(--space-12)' }}>
                <SourceSegment value={editLeadSource} onChange={handleEditSourceChange} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)' }}>
                <CreatableSelect
                  label="CP firm"
                  type="cp_firm"
                  value={editCpFirm}
                  onChange={handleEditFirmChange}
                  required
                />

                <CreatableSelect
                  label="Channel Partner"
                  type="cp"
                  value={editCp}
                  onChange={setEditCp}
                  parentId={editCpFirm?.id}
                  disabled={!editCpFirm}
                  required
                />

                {editLeadSource === 'calling' && (
                  <CreatableSelect
                    label="Caller"
                    type="caller"
                    value={editCaller}
                    onChange={setEditCaller}
                    required
                  />
                )}
              </div>
            </div>

            {/* Booked fields */}
            {client.status === 'booked' && (
              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-16)', marginTop: 'var(--space-16)' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: 'var(--space-8)' }}>
                  Booking information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-unit">Unit details</label>
                    <input
                      id="edit-unit"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tower B 1204"
                      maxLength={80}
                      value={editUnitDetails}
                      onChange={e => setEditUnitDetails(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-book-date">Booking date</label>
                    <input
                      id="edit-book-date"
                      type="date"
                      className="form-input"
                      value={editBookingDate}
                      onChange={e => setEditBookingDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Lost fields */}
            {client.status === 'lost' && (
              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-16)', marginTop: 'var(--space-16)' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: 'var(--space-8)' }}>
                  Lost information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-reason">Lost reason</label>
                    <select
                      id="edit-reason"
                      className="form-select"
                      value={editLostReason}
                      onChange={e => setEditLostReason(e.target.value)}
                    >
                      {LOST_REASONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-note">Lost remarks</label>
                    <input
                      id="edit-note"
                      type="text"
                      className="form-input"
                      maxLength={300}
                      value={editLostNote}
                      onChange={e => setEditLostNote(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-16)' }}>
              <button
                type="submit"
                className="btn btn-primary btn-small"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            {/* Header: Title, Status, and Actions Group */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-12)', marginBottom: 'var(--space-16)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
                  <h1 className="page-title" style={{ marginBottom: 0 }}>
                    {client.clientName}
                  </h1>
                  <StatusChip status={client.status} />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-16)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--space-6)' }}>
                  {client.clientPhone && (
                    <span className="text-meta tabular-nums" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={13} strokeWidth={1.5} />
                      {client.clientPhone}
                    </span>
                  )}
                  {client.projectName && (
                    <span className="text-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} strokeWidth={1.5} />
                      {client.projectName}
                    </span>
                  )}
                  <span className="text-meta tabular-nums" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} strokeWidth={1.5} />
                    Visited {formatDate(client.firstVisitDate)}
                  </span>
                </div>
              </div>

              {/* Uniform Action Buttons */}
              <div className="detail-actions-group">
                {canEdit && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={startEdit}
                      title="Edit client details"
                    >
                      <Edit2 size={13} strokeWidth={1.5} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-destructive btn-small"
                      onClick={handleDeleteClient}
                      title="Delete this entry"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                      <span>Delete</span>
                    </button>
                  </>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={handleArchive}
                    title="Archive client"
                  >
                    <Archive size={13} strokeWidth={1.5} />
                    <span>Archive</span>
                  </button>
                )}
              </div>
            </div>

            {/* Source Information Box */}
            <div className="client-source-card">
              <div className="source-card-header">
                <div className="source-partner-row">
                  <Building2 size={16} strokeWidth={1.5} className="source-card-icon" />
                  <div className="source-names">
                    <span className="source-sublabel">Channel Partner</span>
                    <div className="source-title">
                      {firmName}, <strong>{cpName}</strong>
                    </div>
                  </div>
                </div>
                <span className="source-pill">
                  {isCalling ? (callerName ? `Calling · ${callerName}` : 'Calling') : 'Reference'}
                </span>
              </div>

              <div className="source-card-footer">
                <span className="text-meta">
                  Attended by: <strong>{client.lastSalesManager?.name || 'Unassigned'}</strong>
                </span>
              </div>
            </div>

            {/* Booked / Lost Details Banner */}
            {client.status === 'booked' && (
              <div style={{ marginTop: 'var(--space-12)', padding: 'var(--space-10) var(--space-16)', backgroundColor: 'var(--booked-bg)', color: 'var(--booked-fg)', borderRadius: 'var(--radius-input)', fontSize: '13px' }}>
                <strong>Booked</strong>
                {client.unitDetails && ` - Unit: ${client.unitDetails}`}
                {client.bookingDate && ` on ${formatDate(client.bookingDate)}`}
              </div>
            )}

            {client.status === 'lost' && (
              <div style={{ marginTop: 'var(--space-12)', padding: 'var(--space-10) var(--space-16)', backgroundColor: 'var(--lost-bg)', color: 'var(--lost-fg)', borderRadius: 'var(--radius-input)', fontSize: '13px' }}>
                <strong>Lost</strong>: Reason ({client.lostReason?.replace('_', ' ')})
                {client.lostNote && ` - ${client.lostNote}`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Outcome Status Control */}
      {canEdit && (
        <div style={{ marginBottom: 'var(--space-28)' }}>
          <label className="form-label" style={{ marginBottom: 'var(--space-8)', display: 'block' }}>
            Update outcome status
          </label>
          <div className="segmented-control" role="radiogroup" aria-label="Client status">
            {['in_progress', 'booked', 'lost'].map(st => {
              const isActive = client.status === st;
              const labels = { in_progress: 'In progress', booked: 'Booked', lost: 'Lost' };
              return (
                <button
                  key={st}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  className={`segmented-option ${isActive ? 'active' : ''}`}
                  onClick={() => handleStatusSegmentClick(st)}
                >
                  {labels[st]}
                </button>
              );
            })}
          </div>

          {dialogStatus && (
            <StatusDialog
              targetStatus={dialogStatus}
              onConfirm={statusData => statusMutation.mutate(statusData)}
              onCancel={() => setDialogStatus(null)}
              isSubmitting={statusMutation.isPending}
            />
          )}

          {statusMutation.isError && (
            <div className="state-error" style={{ marginTop: 'var(--space-8)' }}>
              {statusMutation.error?.message || 'Failed to update status.'}
            </div>
          )}
        </div>
      )}

      {/* Timeline Section */}
      <div style={{ marginTop: 'var(--space-32)' }}>
        <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-8)' }}>
          Interaction history ({client.interactions?.length || 0})
        </h2>

        <Timeline
          interactions={client.interactions}
          currentUser={user}
          onUpdateInteraction={(interactionId, data) =>
            updateInteractionMutation.mutateAsync({ interactionId, data })
          }
          onDeleteInteraction={interactionId =>
            deleteInteractionMutation.mutateAsync(interactionId)
          }
        />

        {/* Add Feedback Form */}
        {canEdit && (
          <AddFeedbackForm
            defaultSalesManager={
              client.lastSalesManager
                ? { id: client.lastSalesManager._id, name: client.lastSalesManager.name }
                : null
            }
            onAddFeedback={interaction => addInteractionMutation.mutateAsync(interaction)}
          />
        )}
      </div>

      {/* Status History */}
      {client.statusHistory && client.statusHistory.length > 0 && (
        <div style={{ marginTop: 'var(--space-32)', borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-16)' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 'var(--space-12)' }}>
            Status history
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {client.statusHistory.map((item, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: '13px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-6) 0',
                  borderBottom: '1px dashed var(--hairline)'
                }}
              >
                <div>
                  <StatusChip status={item.status} />
                  {item.note && <span style={{ marginLeft: 'var(--space-8)', color: 'var(--ink)' }}>{item.note}</span>}
                  {item.changedBy?.displayName && (
                    <span className="text-meta" style={{ marginLeft: 'var(--space-8)' }}>
                      by {item.changedBy.displayName}
                    </span>
                  )}
                </div>
                <div className="text-meta tabular-nums">
                  {formatDate(item.changedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
