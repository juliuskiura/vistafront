/**
 * Shared CRM constants. Single source of truth for the prospect flow, status
 * labels, status pill colors, and company size buckets. Mirrors the
 * `frontapp/src/features/crm/apptypes/crm.ts` and
 * `frontapp/src/features/crm/lib/statusColors.ts` modules so the Next.js
 * ports stay byte-identical to the original.
 */

import type { ProspectStatus } from "@/lib/api";

export const PROSPECT_FLOW: ProspectStatus[] = [
  "identified",
  "researching",
  "contact_ready",
  "outreach_sent",
  "engaged",
  "qualified",
  "customer",
];

export const BOARD_STATUSES: ProspectStatus[] = [...PROSPECT_FLOW, "lost"];

export const PROSPECT_LABELS: Record<ProspectStatus, string> = {
  identified: "Identified",
  researching: "Researching",
  contact_ready: "Contact Ready",
  outreach_sent: "Outreach Sent",
  engaged: "Engaged",
  qualified: "Qualified",
  customer: "Customer",
  lost: "Lost",
};

/**
 * Tailwind class map used by both the list-row pill and the status board
 * cards. Same color palette as the original.
 */
export const STATUS_COLORS: Record<ProspectStatus, string> = {
  identified: "bg-slate-100 text-slate-700",
  researching: "bg-violet-100 text-violet-700",
  contact_ready: "bg-cyan-100 text-cyan-700",
  outreach_sent: "bg-amber-100 text-amber-700",
  engaged: "bg-orange-100 text-orange-700",
  qualified: "bg-emerald-100 text-emerald-700",
  customer: "bg-green-100 text-green-700",
  lost: "bg-rose-100 text-rose-700",
};

export const COMPANY_SIZES = [
  "Solo",
  "2-5",
  "6-10",
  "11-25",
  "26-50",
  "51-200",
  "201-1000",
  "1000+",
] as const;

export type CompanySize = (typeof COMPANY_SIZES)[number];

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  Solo: "Solo",
  "2-5": "2-5 employees",
  "6-10": "6-10 employees",
  "11-25": "11-25 employees",
  "26-50": "26-50 employees",
  "51-200": "51-200 employees",
  "201-1000": "201-1000 employees",
  "1000+": "1000+ employees",
};

/**
 * Allowed rows-per-page values for the Companies table. Mirrors the
 * ``ALLOWED_PAGE_SIZES`` tuple on the backend
 * (``crm/pagination.py::CompanyPageNumberPagination``).
 */
export const COMPANY_PAGE_SIZES = [25, 50, 75, 100] as const;
export type CompanyPageSize = (typeof COMPANY_PAGE_SIZES)[number];