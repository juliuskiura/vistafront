import { formatMediumDate } from "@/lib/dates";

export function formatDate(value: string | null | undefined): string {
  return formatMediumDate(value);
}

export function trialDaysLeft(end: string | null | undefined): number | null {
  if (!end) return null;
  const due = new Date(end).getTime();
  if (Number.isNaN(due)) return null;
  return Math.max(0, Math.ceil((due - Date.now()) / 86_400_000));
}