/**
 * Returns today's date as YYYY-MM-DD using local timezone (not UTC).
 * Avoids the off-by-one-day bug caused by Date.toISOString() which returns UTC.
 */
export const localDateStr = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
