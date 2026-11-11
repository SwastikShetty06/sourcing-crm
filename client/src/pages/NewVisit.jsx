import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '../api/clients';
import { SourceSegment } from '../components/SourceSegment';
import { CreatableSelect } from '../components/CreatableSelect';

export function NewVisit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Basic info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectName, setProjectName] = useState('');

  // Source info
  const [leadSource, setLeadSource] = useState('calling');
  const [cpFirm, setCpFirm] = useState(null);
  const [cp, setCp] = useState(null);
  const [caller, setCaller] = useState(null);

  // First interaction
  const [kind, setKind] = useState('site_visit');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [salesManager, setSalesManager] = useState(null);
  const [feedback, setFeedback] = useState('');

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  function handleFirmChange(newFirm) {
    setCpFirm(newFirm);
    setCp(null);
  }

  function handleSourceChange(newSource) {
    setLeadSource(newSource);
    if (newSource === 'reference') {
      setCaller(null);
      if (fieldErrors.caller) {
        setFieldErrors(prev => {
          const next = { ...prev };
          delete next.caller;
          return next;
        });
      }
    }
  }

  function validate() {
    const errors = {};
    if (!clientName.trim() || clientName.trim().length < 2) {
      errors.clientName = 'Client name must be at least 2 characters.';
    }
    if (clientPhone.trim() && !/^[0-9]{10}$/.test(clientPhone.trim())) {
      errors.clientPhone = 'Phone number must be exactly 10 digits.';
    }

    if (!cpFirm || (!cpFirm.id && !cpFirm.name)) {
      errors.cpFirm = 'CP firm is required.';
    }
    if (!cp || (!cp.id && !cp.name)) {
      errors.cp = 'Channel Partner name is required.';
    }

    if (leadSource === 'calling') {
      if (!caller || (!caller.id && !caller.name)) {
        errors.caller = 'Caller name is required for Calling source.';
      }
    }

    if (!salesManager || (!salesManager.id && !salesManager.name)) {
      errors.salesManager = 'Sales manager is required.';
    }

    if (!feedback.trim() || feedback.trim().length < 3) {
      errors.feedback = 'Feedback must be at least 3 characters.';
    }

    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneralError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});

    try {
      setIsSubmitting(true);
      const payload = {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        projectName: projectName.trim() || undefined,
        leadSource,
        cpFirm,
        cp,
        firstVisitDate: visitDate ? new Date(visitDate).toISOString() : new Date().toISOString(),
        kind,
        occurredAt: visitDate ? new Date(visitDate).toISOString() : new Date().toISOString(),
        salesManager,
        feedback: feedback.trim()
      };

      if (leadSource === 'calling' && caller && (caller.id || caller.name)) {
        payload.caller = caller;
      }

      const newClient = await createClient(payload);

      // Invalidate queries so lookups and client list update
      queryClient.invalidateQueries({ queryKey: ['lookups'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      navigate(`/clients/${newClient._id}`);
    } catch (err) {
      if (err.fields) {
        setFieldErrors(err.fields);
      }
      setGeneralError(err.message || 'Failed to save visit.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <h1 className="page-title">New visit</h1>

      {generalError && <div className="state-error">{generalError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* Step 1: Basic client info */}
        <div style={{ marginBottom: 'var(--space-24)', padding: 'var(--space-16)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-input)', backgroundColor: 'var(--surface)' }}>
          <h2 style={{ fontSize: '16px', marginBottom: 'var(--space-16)' }}>1. Client details</h2>

          <div className="form-group">
            <label className="form-label" htmlFor="clientName">
              Client name
              <span className="required-mark">*</span>
            </label>
            <input
              id="clientName"
              type="text"
              className="form-input"
              placeholder="e.g. Ramesh Iyer"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
            />
            {fieldErrors.clientName && (
              <span className="form-error">{fieldErrors.clientName}</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="clientPhone">
                Mobile number (10 digits)
              </label>
              <input
                id="clientPhone"
                type="tel"
                className="form-input"
                placeholder="e.g. 9820011223"
                maxLength={10}
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value.replace(/\D/g, ''))}
              />
              {fieldErrors.clientPhone && (
                <span className="form-error">{fieldErrors.clientPhone}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="projectName">
                Project or site visited
              </label>
              <input
                id="projectName"
                type="text"
                className="form-input"
                placeholder="e.g. Marina Bay Towers"
                maxLength={80}
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
              />
              {fieldErrors.projectName && (
                <span className="form-error">{fieldErrors.projectName}</span>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Channel Partner & Lead Source */}
        <div style={{ marginBottom: 'var(--space-24)', padding: 'var(--space-16)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-input)', backgroundColor: 'var(--surface)' }}>
          <h2 style={{ fontSize: '16px', marginBottom: 'var(--space-4)' }}>2. Channel Partner & source</h2>
          <div className="text-meta" style={{ marginBottom: 'var(--space-16)' }}>
            All visits are provided by Channel Partners, either via Calling or Reference.
          </div>

          <div style={{ marginBottom: 'var(--space-16)' }}>
            <label className="form-label" style={{ marginBottom: 'var(--space-8)', display: 'block' }}>
              How did the Channel Partner provide the visit?
            </label>
            <SourceSegment value={leadSource} onChange={handleSourceChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)', marginBottom: leadSource === 'calling' ? 'var(--space-12)' : 0 }}>
            <CreatableSelect
              label="CP firm"
              type="cp_firm"
              value={cpFirm}
              onChange={handleFirmChange}
              required
              placeholder="Select or add firm"
              error={fieldErrors.cpFirm}
            />

            <CreatableSelect
              label="Channel Partner"
              type="cp"
              value={cp}
              onChange={setCp}
              parentId={cpFirm?.id}
              disabled={!cpFirm}
              required
              placeholder={cpFirm ? 'Select or add partner' : 'Pick a firm first'}
              hint={!cpFirm ? 'Pick a firm first' : null}
              error={fieldErrors.cp}
            />
          </div>

          {leadSource === 'calling' && (
            <CreatableSelect
              label="Caller"
              type="caller"
              value={caller}
              onChange={setCaller}
              required
              placeholder="Select or add caller"
              error={fieldErrors.caller}
            />
          )}
        </div>

        {/* Step 3: First Interaction */}
        <div style={{ marginBottom: 'var(--space-24)', padding: 'var(--space-16)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-input)', backgroundColor: 'var(--surface)' }}>
          <h2 style={{ fontSize: '16px', marginBottom: 'var(--space-16)' }}>3. First interaction</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-12)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="kind">
                Interaction kind
              </label>
              <select
                id="kind"
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
              <label className="form-label" htmlFor="visitDate">
                Visit date
              </label>
              <input
                id="visitDate"
                type="date"
                className="form-input"
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
              />
            </div>

            <CreatableSelect
              label="Sales manager"
              type="sales_manager"
              value={salesManager}
              onChange={setSalesManager}
              required
              placeholder="Select or add manager"
              error={fieldErrors.salesManager}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="feedback">
              Feedback
              <span className="required-mark">*</span>
            </label>
            <textarea
              id="feedback"
              className="form-textarea"
              placeholder="Specific feedback from client during visit or call"
              value={feedback}
              maxLength={2000}
              onChange={e => setFeedback(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {fieldErrors.feedback ? (
                <span className="form-error">{fieldErrors.feedback}</span>
              ) : <span />}
              <span className="text-meta">{feedback.length}/2000</span>
            </div>
          </div>
        </div>

        {/* Step 4: Status preview */}
        <div style={{ marginBottom: 'var(--space-24)', padding: 'var(--space-12) var(--space-16)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-input)', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="form-label">Initial status</div>
            <div className="text-meta">Status defaults to In progress and can be updated from client record.</div>
          </div>
          <span className="status-chip status-chip-in_progress">In progress</span>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', minHeight: '48px' }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving visit...' : 'Save visit'}
        </button>
      </form>
    </div>
  );
}
