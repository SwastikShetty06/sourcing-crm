import React, { useState } from 'react';

const LOST_REASONS = [
  { value: 'budget', label: 'Budget constraints' },
  { value: 'location', label: 'Location mismatch' },
  { value: 'chose_competitor', label: 'Chose competitor' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'unreachable', label: 'Unreachable' },
  { value: 'other', label: 'Other reason' }
];

export function StatusDialog({
  targetStatus,
  onConfirm,
  onCancel,
  isSubmitting = false
}) {
  const [lostReason, setLostReason] = useState('budget');
  const [lostNote, setLostNote] = useState('');
  const [unitDetails, setUnitDetails] = useState('');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (targetStatus === 'lost' && !lostReason) {
      setError('Please select a reason why the client was lost.');
      return;
    }

    onConfirm({
      status: targetStatus,
      note: note.trim() || undefined,
      lostReason: targetStatus === 'lost' ? lostReason : undefined,
      lostNote: targetStatus === 'lost' ? lostNote.trim() : undefined,
      unitDetails: targetStatus === 'booked' ? unitDetails.trim() : undefined,
      bookingDate: targetStatus === 'booked' && bookingDate ? new Date(bookingDate).toISOString() : undefined
    });
  }

  return (
    <div className="inline-panel" style={{ border: '1px solid var(--hairline)', backgroundColor: 'var(--surface)' }}>
      <h3 style={{ fontSize: '16px', marginBottom: 'var(--space-12)' }}>
        {targetStatus === 'booked' ? 'Mark client as booked' : 'Why was this lost?'}
      </h3>

      {error && <div className="state-error">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {targetStatus === 'booked' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="unitDetails">
                Unit / flat details
              </label>
              <input
                id="unitDetails"
                type="text"
                className="form-input"
                placeholder="e.g. Tower B 1402, 3 BHK"
                maxLength={80}
                value={unitDetails}
                onChange={e => setUnitDetails(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bookingDate">
                Booking date
              </label>
              <input
                id="bookingDate"
                type="date"
                className="form-input"
                value={bookingDate}
                onChange={e => setBookingDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {targetStatus === 'lost' && (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="lostReason">
                Reason
                <span className="required-mark">*</span>
              </label>
              <select
                id="lostReason"
                className="form-select"
                value={lostReason}
                onChange={e => setLostReason(e.target.value)}
              >
                {LOST_REASONS.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lostNote">
                Lost remarks
              </label>
              <input
                id="lostNote"
                type="text"
                className="form-input"
                placeholder="Additional notes on why client did not proceed"
                maxLength={300}
                value={lostNote}
                onChange={e => setLostNote(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="statusNote">
            Status change note (optional)
          </label>
          <input
            id="statusNote"
            type="text"
            className="form-input"
            placeholder="Brief reason for status change"
            maxLength={300}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-12)' }}>
          <button
            type="submit"
            className="btn btn-primary btn-small"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Confirm status'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
