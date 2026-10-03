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

/**
 * Medium date *and* time, e.g. "Sep 20, 2026, 3:07 PM".
 *
 * The same medium format as `formatMediumDate`, with the clock appended for the
 * places where "when" is the point rather than "which day": a comment thread, a
 * chat transcript, an activity feed. Date-only is wrong there — "an hour ago"
 * and "yesterday" read identically — and the year is kept so an old comment
 * cannot masquerade as a recent one.
 *
 * Lives here rather than inline in a component so there is still exactly one
 * place that decides how this app formats a timestamp (§12 of AGENTS.md).
 * Returns the same em-dash for a missing value, matching `formatMediumDate`.
 */
export function formatMediumDateTime(
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
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}