import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CreatableSelect } from './CreatableSelect';

export function AddFeedbackForm({ onAddFeedback, defaultSalesManager = null }) {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState('revisit');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [salesManager, setSalesManager] = useState(defaultSalesManager);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!feedback.trim() || feedback.trim().length < 3) {
      setError('Feedback must be at least 3 characters.');
      return;
    }
    if (!salesManager || (!salesManager.id && !salesManager.name)) {
      setError('Sales manager is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddFeedback({
        kind,
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
        salesManager,
        feedback: feedback.trim()
      });
      // Invalidate lookups query so new manager appears in dropdowns
      queryClient.invalidateQueries({ queryKey: ['lookups'] });
      setFeedback('');
    } catch (err) {
      setError(err.message || 'Failed to add feedback.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 'var(--space-20)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-input)', backgroundColor: 'var(--surface)', marginTop: 'var(--space-24)' }}>
      <h3 style={{ fontSize: '16px', marginBottom: 'var(--space-16)' }}>Add feedback</h3>

      {error && <div className="state-error">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-12)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="feedback-kind">
              Interaction type
            </label>
            <select
              id="feedback-kind"
              className="form-select"
              value={kind}
              onChange={e => setKind(e.target.value)}
            >
              <option value="site_visit">Site visit</option>
              <option value="revisit">Revisit</option>
              <option value="call">Call</option>
              <option value="vc">VC</option>
              <option value="obm">OBM</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="feedback-date">
              Date
            </label>
            <input
              id="feedback-date"
              type="date"
              className="form-input"
              value={occurredAt}
              onChange={e => setOccurredAt(e.target.value)}
            />
          </div>

          <CreatableSelect
            label="Sales manager"
            type="sales_manager"
            value={salesManager}
            onChange={setSalesManager}
            required
            placeholder="Type or select manager"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="feedback-text">
            Feedback
            <span className="required-mark">*</span>
          </label>
          <textarea
            id="feedback-text"
            className="form-textarea"
            placeholder="Record client questions, preferences, budget remarks or objections"
            value={feedback}
            maxLength={2000}
            onChange={e => setFeedback(e.target.value)}
          />
          <div className="text-meta" style={{ textAlign: 'right' }}>
            {feedback.length}/2000
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add feedback'}
        </button>
      </form>
    </div>
  );
}
