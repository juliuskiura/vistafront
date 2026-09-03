"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PROSPECT_LABELS,
  STATUS_COLORS,
} from "@/lib/crm/constants";
import type {
  Company,
  ProspectStatus,
  TierClassification,
} from "@/lib/api";
import { bulkDeleteCompaniesAction } from "@/app/(app)/[workspace]/dashboard/companies/actions";
import { useToast } from "@/lib/context";

interface Props {
  companies: Company[];
  tierClassifications: TierClassification[];
  workspaceDomain: string;
  workspaceNanoid: string;
  /** Current `?ordering=` value (e.g. `name`, `-name`, or `undefined`). */
  ordering?: string;
  /** Reported to the parent so it can push the new ordering to `searchParams`. */
  onOrderingChange?: (ordering: string | undefined) => void;
}

const STORAGE_KEY = "company-table-column-visibility";

/**
 * Columns the user can sort by. Sorting itself is server-side; the table
 * only renders the control and reports the chosen field/direction upward
 * via `onOrderingChange`.
 */
const SORTABLE_COLUMNS: Record<string, string> = {
  name: "name",
  status: "status",
  verified: "verified",
  industry: "industry",
  contact_count: "contact_count",
  total_listings: "total_listings",
  tier: "tier",
  created_at: "created_at",
};

const TOGGLEABLE_COLUMNS: { id: string; label: string }[] = [
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
const DEFAULT_VISIBLE_COLUMN_IDS: string[] = [
  "name",
  "status",
  "industry",
  "contact_count",
];

const DEFAULT_VISIBLE: VisibilityState = TOGGLEABLE_COLUMNS.reduce<VisibilityState>(
  (acc, c) => {
    acc[c.id] = !DEFAULT_VISIBLE_COLUMN_IDS.includes(c.id);
    return acc;
  },
  {},
);

function readStoredVisibility(): VisibilityState {
  if (typeof window === "undefined") return DEFAULT_VISIBLE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as VisibilityState;
  } catch {
    /* corrupted storage */
  }
  return DEFAULT_VISIBLE;
}

const columnHelper = createColumnHelper<Company>();

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, "");
}

/**
 * Companies table — TanStack Table v8 with manual sorting, localStorage-
 * persisted column visibility, row-level selection, and a bulk-action
 * toolbar. Mirrors `frontapp/src/features/crm/components/company/CompaniesTable.tsx`.
 */
export function CompaniesTable({
  companies,
  tierClassifications,
  workspaceDomain,
  workspaceNanoid,
  ordering,
  onOrderingChange,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    DEFAULT_VISIBLE,
  );

  useEffect(() => {
    setColumnVisibility(readStoredVisibility());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(columnVisibility),
      );
    } catch {
      /* storage not available */
    }
  }, [columnVisibility]);

  const selectedNanoids = Object.keys(rowSelection).filter(
    (id) => rowSelection[id],
  );
  const selectedCount = selectedNanoids.length;

  const currentField = ordering?.startsWith("-")
    ? ordering.slice(1)
    : ordering;
  const currentDir: "asc" | "desc" | null = ordering
    ? ordering.startsWith("-")
      ? "desc"
      : "asc"
    : null;

  // Clicking a sortable header cycles asc -> desc -> off. Sorting is reported
  // to the parent so it can re-query the server; we never sort locally.
  function handleSortToggle(columnId: string) {
    const field = SORTABLE_COLUMNS[columnId];
    if (!field || !onOrderingChange) return;
    if (currentField !== field) {
      onOrderingChange(field);
    } else if (currentDir === "asc") {
      onOrderingChange(`-${field}`);
    } else {
      onOrderingChange(undefined);
    }
  }

  const columns = [
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
      cell: (info) => (
        <Link
          href={`/${workspaceDomain}/dashboard/companies/${info.row.original.nanoid}`}
          className="font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {info.getValue()}
        </Link>
      ),
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
      cell: (info) =>
        info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : "—",
    }),
  ];

  const table = useReactTable({
    data: companies,
    columns,
    state: { rowSelection, columnVisibility },
    getRowId: (row) => row.nanoid,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    // Sorting is handled by the server, not the client table model.
    manualSorting: true,
  });

  function handleBulkDelete() {
    if (selectedCount === 0) return;
    const nanoids = [...selectedNanoids];
    const ok = window.confirm(
      `Delete ${selectedCount} compan${selectedCount === 1 ? "y" : "ies"}? This action cannot be undone.`,
    );
    if (!ok) return;
    startTransition(async () => {
      try {
        const { deleted, failed } = await bulkDeleteCompaniesAction(
          nanoids,
          workspaceNanoid,
        );
        toast.push({
          variant: failed === 0 ? "success" : "error",
          message:
            failed === 0
              ? `Deleted ${deleted} compan${deleted === 1 ? "y" : "ies"}.`
              : `Deleted ${deleted}; ${failed} failed.`,
        });
        setRowSelection({});
      } catch (error) {
        console.error("bulkDeleteCompaniesAction failed:", error);
        toast.push({
          variant: "error",
          message: "Could not delete the selected companies.",
        });
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <details className="relative">
          <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
            <SlidersHorizontal size={14} className="size-3.5" />
            Columns
          </summary>
          <div className="absolute right-0 z-20 mt-1 max-h-72 w-56 overflow-y-auto rounded-md border bg-popover p-2 text-sm shadow-lg">
            {TOGGLEABLE_COLUMNS.map((col) => {
              const visible =
                table.getColumn(col.id)?.getIsVisible() ?? true;
              return (
                <label
                  key={col.id}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) =>
                      table
                        .getColumn(col.id)
                        ?.toggleVisibility(e.target.checked)
                    }
                    className="size-4 rounded border-input"
                  />
                  {col.label}
                </label>
              );
            })}
          </div>
        </details>
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <span className="text-sm font-medium text-muted-foreground">
            {selectedCount} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={selectedCount !== 1}
              onClick={() =>
                router.push(
                  `/${workspaceDomain}/dashboard/companies/${selectedNanoids[0]}`,
                )
              }
            >
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={selectedCount !== 1}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={pending}
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRowSelection({})}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/50 text-left">
                {hg.headers.map((header) => {
                  const columnId = header.column.id;
                  const isSortable = columnId in SORTABLE_COLUMNS;
                  const isActive =
                    isSortable &&
                    currentField === SORTABLE_COLUMNS[columnId];
                  const sortDir = isActive ? currentDir : null;
                  return (
                    <th key={header.id} className="px-4 py-3 font-medium">
                      {header.isPlaceholder
                        ? null
                        : columnId === "select"
                          ? flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )
                          : isSortable
                            ? (
                              <button
                                type="button"
                                onClick={() => handleSortToggle(columnId)}
                                className="inline-flex items-center gap-1 hover:text-foreground"
                                aria-label={`Sort by ${columnId}`}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                                {sortDir === "asc" ? (
                                  <ArrowUp
                                    size={14}
                                    className="size-3.5 text-foreground"
                                  />
                                ) : sortDir === "desc" ? (
                                  <ArrowDown
                                    size={14}
                                    className="size-3.5 text-foreground"
                                  />
                                ) : (
                                  <span className="flex flex-col text-foreground">
                                    <ChevronUp
                                      size={10}
                                      className="size-2.5"
                                    />
                                    <ChevronDown
                                      size={10}
                                      className="size-2.5"
                                    />
                                  </span>
                                )}
                              </button>
                            )
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getVisibleLeafColumns().length}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  No companies.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() =>
                    router.push(
                      `/${workspaceDomain}/dashboard/companies/${row.original.nanoid}`,
                    )
                  }
                  className="cursor-pointer border-b last:border-0 hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      onClick={
                        cell.column.id === "select"
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                      className="px-4 py-3"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}