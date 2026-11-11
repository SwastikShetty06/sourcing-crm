import React from 'react';

const STATUS_LABELS = {
  in_progress: 'In progress',
  booked: 'Booked',
  lost: 'Lost'
};

export function StatusChip({ status }) {
  const label = STATUS_LABELS[status] || status || 'In progress';
  return (
    <span className={`status-chip status-chip-${status || 'in_progress'}`}>
      {label}
    </span>
  );
}
