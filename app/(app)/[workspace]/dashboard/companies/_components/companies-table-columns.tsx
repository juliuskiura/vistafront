"use client";

import Link from "next/link";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { PROSPECT_LABELS, STATUS_COLORS } from "@/lib/crm/constants";
import { formatMediumDate } from "@/lib/dates";
import { Archive } from "@/lib/icons";
import type { Company, ProspectStatus, TierClassification } from "@/lib/api";

/**
 * The Companies table columns.
 *
 * Kept apart from the table shell so the column definitions stay readable
 * and the table file does not have to carry both the definitions and the
 * rendering machinery.
 */
export const columnHelper = createColumnHelper<Company>();

export const SORTABLE_COLUMNS: Record<string, string> = {
  name: "name",
  status: "status",
  verified: "verified",
  industry: "industry",
  contact_count: "contact_count",
  total_listings: "total_listings",
  tier: "tier",
  created_at: "created_at",
};

export const TOGGLEABLE_COLUMNS: { id: string; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "status", label: "Status" },
  { id: "verified", label: "Verified" },
  { id: "industry", label: "Industry" },
  { id: "size", label: "Size" },
  { id: "domain", label: "Domain" },
  { id: "email", label: "Email" },
  { id: "country", label: "Country" },
  { id: "city", label: "City" },
  { id: "address", label: "Address" },
  { id: "contact_count", label: "Contacts" },
  { id: "total_listings", label: "Listings" },
  { id: "tier", label: "Tier" },
  { id: "phone_numbers", label: "Phone #" },
  { id: "social_links", label: "Socials" },
  { id: "about", label: "About" },
  { id: "created_at", label: "Created" },
];

/**
 * Columns visible by default when the table first renders (toggle the rest
 * on via the "Columns" selector). Mirrors `DEFAULT_HIDDEN_COLUMNS` in the
 * original — only `name`, `status`, `industry`, and `contact_count` are
 * shown out of the box.
 */
export const DEFAULT_VISIBLE_COLUMN_IDS: string[] = [
  "name",
  "industry",
  "contact_count",
  "status",
  "tier",
];

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, "");
}

export function buildCompanyColumns(
  workspaceDomain: string,
  tierClassifications: TierClassification[],
): ColumnDef<Company, any>[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  return [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          aria-label="Select all"
          checked={table.getIsAllRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomeRowsSelected();
          }}
          onChange={table.getToggleAllRowsSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="size-4 cursor-pointer rounded border-input"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label="Select row"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="size-4 cursor-pointer rounded border-input"
        />
      ),
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => {
        const company = info.row.original;
        return (
          <span className="flex flex-wrap items-center gap-2">
            <Link
              href={`/${workspaceDomain}/dashboard/companies/${company.nanoid}`}
              className="font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {info.getValue()}
            </Link>
            {company.archived ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Archive className="size-3" aria-hidden="true" />
                Archived
              </span>
            ) : null}
          </span>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const s = info.getValue() as ProspectStatus;
        return (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[s] ?? ""}`}
          >
            {PROSPECT_LABELS[s]}
          </span>
        );
      },
    }),
    columnHelper.accessor("verified", {
      header: "Verified",
      cell: (info) => (info.getValue() ? "Yes" : "No"),
    }),
    columnHelper.accessor("industry", {
      header: "Industry",
      cell: (info) => (
        <span className="text-muted-foreground">
          {info.getValue() || "—"}
        </span>
      ),
    }),
    columnHelper.accessor("contact_count", {
      header: "Contacts",
      cell: (info) => info.getValue() ?? 0,
    }),
    columnHelper.accessor("size", {
      id: "size",
      header: "Size",
      cell: (info) => (info.getValue() as string) || "—",
    }),
    columnHelper.accessor("domain", {
      id: "domain",
      header: "Domain",
      cell: (info) => {
        const v = info.getValue() as string;
        if (!v) return "—";
        const href = /^https?:\/\//.test(v) ? v : `https://${v}`;
        return (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-primary hover:underline"
          >
            {stripProtocol(v)}
          </a>
        );
      },
    }),
    columnHelper.accessor("email", {
      id: "email",
      header: "Email",
      cell: (info) => {
        const v = info.getValue() as string;
        return v ? (
          <a
            href={`mailto:${v}`}
            onClick={(e) => e.stopPropagation()}
            className="text-primary hover:underline"
          >
            {v}
          </a>
        ) : (
          "—"
        );
      },
    }),
    columnHelper.accessor("country", {
      id: "country",
      header: "Country",
      cell: (info) => (info.getValue() as string) || "—",
    }),
    columnHelper.accessor("city", {
      id: "city",
      header: "City",
      cell: (info) => (info.getValue() as string) || "—",
    }),
    columnHelper.accessor("address", {
      id: "address",
      header: "Address",
      cell: (info) => (info.getValue() as string) || "—",
    }),
    columnHelper.accessor("total_listings", {
      id: "total_listings",
      header: "Listings",
      cell: (info) => (info.getValue() as number | null) ?? 0,
    }),
    columnHelper.accessor((row) => row.tier ?? "", {
      id: "tier",
      header: "Tier",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        if (!value) return "—";
        const found = tierClassifications.find((t) => t.nanoid === value);
        if (found) return `${found.label} — ${found.title}`;
        return info.row.original.tier_label ?? value;
      },
    }),
    columnHelper.accessor("phone_numbers", {
      id: "phone_numbers",
      header: "Phone #",
      cell: (info) => {
        const v = (info.getValue() as string[]) ?? [];
        return v.length
          ? `${v.length} number${v.length > 1 ? "s" : ""}`
          : "—";
      },
    }),
    columnHelper.accessor("social_links", {
      id: "social_links",
      header: "Socials",
      cell: (info) => {
        const v =
          (info.getValue() as { name?: string; url?: string }[]) ?? [];
        return v.length ? `${v.length} linked` : "—";
      },
    }),
    columnHelper.accessor("about", {
      id: "about",
      header: "About",
      cell: (info) => {
        const v = (info.getValue() as string) || "";
        return v ? (
          <span
            className="block max-w-xs truncate text-muted-foreground"
            title={v}
          >
            {v}
          </span>
        ) : (
          "—"
        );
      },
    }),
    columnHelper.accessor("created_at", {
      id: "created_at",
      header: "Created",
      cell: (info) => (
        <span className="text-muted-foreground">
          {formatMediumDate(info.getValue() as string)}
        </span>
      ),
    }),
  ];
}
