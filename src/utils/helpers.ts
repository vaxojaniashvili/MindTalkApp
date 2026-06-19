/**
 * Build a display name from an object that may have first_name, last_name, and/or display_name.
 */
export function getDisplayName(obj: {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
}): string {
  if (obj?.display_name) return obj.display_name;
  const parts = [obj?.first_name, obj?.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unknown';
}

// ─── Safe date/time formatting ───
// Hermes builds may ship without full Intl, where Date#toLocale* can throw
// ("constructor is not callable"). These helpers format manually so the UI
// never depends on Intl.

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDate(value: string | number | Date): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

/** "14:05" (24h). */
export function formatTime(value: string | number | Date): string {
  const d = toDate(value);
  if (!d) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "5 Jun 2026" */
export function formatDate(value: string | number | Date): string {
  const d = toDate(value);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Thu, 5 Jun · 14:05" */
export function formatDateTime(value: string | number | Date): string {
  const d = toDate(value);
  if (!d) return '';
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} · ${formatTime(d)}`;
}

/** "Jun 5" */
export function formatMonthDay(value: string | number | Date): string {
  const d = toDate(value);
  if (!d) return '';
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** "Thursday, 5 June" style — long-ish but Intl-free. */
export function formatLongDate(value: string | number | Date): string {
  const d = toDate(value);
  if (!d) return '';
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
