import React from 'react';

export function LoadingState({
  text = 'Loading records...',
  subtext = 'Synchronizing visits & bookings',
  fullScreen = false,
  inline = false
}) {
  return (
    <div
      className={`custom-loading-container ${fullScreen ? 'custom-loading-fullscreen' : ''} ${inline ? 'custom-loading-inline' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="custom-loading-orb">
        {/* Outer Hairline Compass Track */}
        <div className="custom-loading-track" />

        {/* Dual Orbit Sweeps (Teal & Amber) */}
        <div className="custom-loading-sweep" />

        {/* Central Home & Verified Deal Badge */}
        <div className="custom-loading-badge">
          {/* Home Icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>

          {/* Hairline Divider */}
          <span className="custom-loading-divider" />

          {/* Deal Done Handshake / Verified Deal Icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--booked-fg)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2.7-2.7a1 1 0 0 0-1.4 0l-1.3 1.3" />
            <path d="m13 11-1.3-1.3a1 1 0 0 0-1.4 0L6 14" />
            <path d="m18 11 3-3" />
            <path d="m3 11 3-3" />
            <path d="M7 17l-4-4" />
          </svg>
        </div>
      </div>

      <div className="custom-loading-text">
        <span>{text}</span>
        <span className="loading-dots" aria-hidden="true">
          <span className="loading-dot">.</span>
          <span className="loading-dot">.</span>
          <span className="loading-dot">.</span>
        </span>
      </div>

      {subtext && <div className="custom-loading-subtext">{subtext}</div>}
    </div>
  );
}

export { LoadingState as LoadingSpinner };
