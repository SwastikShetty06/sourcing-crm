import React from 'react';

const OPTIONS = [
  { value: 'calling', label: 'Calling' },
  { value: 'reference', label: 'Reference' }
];

export function SourceSegment({ value, onChange }) {
  return (
    <div className="segmented-control" role="radiogroup" aria-label="Visit source">
      {OPTIONS.map(opt => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`segmented-option ${isActive ? 'active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
