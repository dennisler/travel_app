/**
 * Formats a numeric value into the specified currency string using Intl.NumberFormat.
 */
export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${Math.round(amount).toLocaleString()}`;
  }
}

/**
 * Format a date string (YYYY-MM-DD) into human-readable format.
 */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return date.toLocaleDateString('en-US', options || {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date range.
 */
export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  return `${formatDate(startDate)} – ${formatDate(endDate, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

/**
 * Calculate difference in days between two YYYY-MM-DD dates inclusive.
 */
export function calculateDaysBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

/**
 * Format duration in minutes to hours & minutes.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}
