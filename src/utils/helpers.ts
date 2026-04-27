/**
 * Build a display name from an object that may have first_name, last_name, and/or display_name.
 */
export function getDisplayName(obj: {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
}): string {
  if (obj.display_name) return obj.display_name;
  const parts = [obj.first_name, obj.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unknown';
}
