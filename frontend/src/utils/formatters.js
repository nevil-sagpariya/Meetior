/**
 * Formatting helpers for UI presentation.
 */

export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'TBA';
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return 'TBA';
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength).trim() + '...';
}
