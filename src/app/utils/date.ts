/**
 * Returns today's date as YYYY-MM-DD in local timezone.
 * Avoids the off-by-one-day bug from Date.toISOString() which returns UTC.
 */
export const localDateStr = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Parses a date value (YYYY-MM-DD string or ISO string) as a local Date.
 * Strings of exactly 10 chars are treated as local midnight to avoid UTC offset.
 */
export const parseLocalDate = (value: string): Date => {
  if (!value) return new Date(NaN);
  return value.length === 10
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
};

/**
 * Formats a date value for display as a short date (dd/mm/yyyy).
 * Returns '---' for null/undefined/empty.
 */
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '---';
  return parseLocalDate(value).toLocaleDateString('es-MX', { dateStyle: 'short' });
};

/**
 * Formats a date value for display including time (dd/mm/yyyy hh:mm).
 * Returns '---' for null/undefined/empty.
 */
export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '---';
  return new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' } as any);
};

/**
 * Returns the YYYY-MM-DD representation of a date value in local timezone.
 * Used for deduplication comparisons against date-input values.
 */
export const toLocalDateKey = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.length === 10 ? value : localDateStr(new Date(value));
};
