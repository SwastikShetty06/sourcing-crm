import { formatDate } from './format';

function escapeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // Replace quotes with double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportClientsToExcel(clients, filename = 'Sourcing_CRM_Clients.csv') {
  if (!clients || clients.length === 0) {
    alert('No client records to export.');
    return;
  }

  const headers = [
    'Client Name',
    'Phone Number',
    'Project / Site Visited',
    'Lead Source',
    'CP Firm',
    'Channel Partner',
    'Caller',
    'Visited Date',
    'Current Status',
    'Unit / Flat Details',
    'Booking Date',
    'Lost Reason',
    'Lost Remarks',
    'Last Sales Manager',
    'Total Interactions',
    'Last Interaction Date',
    'Created By Manager'
  ];

  const rows = clients.map(c => {
    let leadSourceLabel = c.leadSource;
    if (c.leadSource === 'channel_partner') leadSourceLabel = 'Channel Partner';
    else if (c.leadSource === 'calling') leadSourceLabel = 'Calling';
    else if (c.leadSource === 'reference') leadSourceLabel = 'Reference';

    const statusLabel =
      c.status === 'booked'
        ? 'Booked'
        : c.status === 'lost'
        ? 'Lost'
        : 'In progress';

    return [
      escapeCsvCell(c.clientName),
      escapeCsvCell(c.clientPhone || ''),
      escapeCsvCell(c.projectName || ''),
      escapeCsvCell(leadSourceLabel),
      escapeCsvCell(c.cpFirm?.name || ''),
      escapeCsvCell(c.cp?.name || ''),
      escapeCsvCell(c.caller?.name || ''),
      escapeCsvCell(c.firstVisitDate ? formatDate(c.firstVisitDate) : ''),
      escapeCsvCell(statusLabel),
      escapeCsvCell(c.unitDetails || ''),
      escapeCsvCell(c.bookingDate ? formatDate(c.bookingDate) : ''),
      escapeCsvCell(c.lostReason ? c.lostReason.replace('_', ' ') : ''),
      escapeCsvCell(c.lostNote || ''),
      escapeCsvCell(c.lastSalesManager?.name || ''),
      escapeCsvCell(c.interactions?.length || 0),
      escapeCsvCell(c.lastInteractionAt ? formatDate(c.lastInteractionAt) : ''),
      escapeCsvCell(c.createdBy?.displayName || '')
    ].join(',');
  });

  // UTF-8 BOM so Microsoft Excel correctly reads special characters and encoding
  const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
