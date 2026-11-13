import React from 'react';

export function Table({
  columns,
  data = [],
  onRowClick,
  emptyMessage = 'No records found.'
}) {
  if (!data || data.length === 0) {
    return (
      <div className="table-container">
        <div className="state-empty">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table responsive-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key || col.header} style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => {
            const isClickable = Boolean(onRowClick);
            return (
              <tr
                key={row._id || row.id || rowIdx}
                className={isClickable ? 'clickable' : ''}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map(col => {
                  const content = col.render ? col.render(row) : row[col.key];
                  const isBadge =
                    col.key === 'status' ||
                    col.key === 'daysSinceLastInteraction' ||
                    col.header === 'Status' ||
                    col.header === 'Days overdue';
                  return (
                    <td
                      key={col.key || col.header}
                      data-label={col.header}
                      className={isBadge ? 'td-badge' : ''}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
