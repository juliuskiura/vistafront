const RE_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Medium date format, e.g. "Sep 20, 2026" (abbreviated month, day, year).
 * Handles both full ISO timestamps and date-only "YYYY-MM-DD" values without
 * timezone drift (date-only values parse as local noon).
 */
export function formatMediumDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  const d = RE_DATE_ONLY.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}