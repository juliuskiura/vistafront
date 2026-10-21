"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table";

import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from "@/lib/icons";
import type { Company, TierClassification } from "@/lib/api";
import { bulkDeleteCompaniesAction } from "@/app/(app)/[workspace]/dashboard/companies/actions";
import { useToast } from "@/lib/context";
import {
  buildCompanyColumns,
  DEFAULT_VISIBLE_COLUMN_IDS,
  SORTABLE_COLUMNS,
  TOGGLEABLE_COLUMNS,
} from "./_components/companies-table-columns";
import { CompaniesTableToolbar } from "./_components/companies-table-toolbar";
import { CompaniesBulkToolbar } from "./_components/companies-bulk-toolbar";

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

const DEFAULT_VISIBLE: VisibilityState = TOGGLEABLE_COLUMNS.reduce<VisibilityState>(
  (acc, c) => {
    acc[c.id] = DEFAULT_VISIBLE_COLUMN_IDS.includes(c.id);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const columns = buildCompanyColumns(workspaceDomain, tierClassifications);

  const table = useReactTable({
    data: companies,
    columns,
    state: { rowSelection, columnVisibility },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const confirmBulkDelete = () => {
    startTransition(async () => {
      const { deleted, failed } = await bulkDeleteCompaniesAction(
        selectedNanoids,
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
      setDeleteDialogOpen(false);
    });
  };

  return (
    <div className="space-y-3">
      <CompaniesTableToolbar table={table} />

      {selectedCount > 0 ? (
        <CompaniesBulkToolbar
          selectedCount={selectedCount}
          selectedNanoids={selectedNanoids}
          workspaceDomain={workspaceDomain}
          pending={pending}
          onDelete={() => setDeleteDialogOpen(true)}
          onClear={() => setRowSelection({})}
        />
      ) : null}

      <Card className="overflow-x-auto overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b bg-muted/50 text-left">
                  {hg.headers.map((header) => {
                    const columnId = header.column.id;
                    const isSortable = columnId in SORTABLE_COLUMNS;
                    const isActive =
                      isSortable && currentField === SORTABLE_COLUMNS[columnId];
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
                                      className="size-3.5 text-foreground"
                                      aria-hidden="true"
                                    />
                                  ) : sortDir === "desc" ? (
                                    <ArrowDown
                                      className="size-3.5 text-foreground"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <span className="flex flex-col text-foreground">
                                      <ChevronUp
                                        className="size-2.5"
                                        aria-hidden="true"
                                      />
                                      <ChevronDown
                                        className="size-2.5"
                                        aria-hidden="true"
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
        </div>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete companies?"
        description={`This will permanently delete ${selectedCount} compan${selectedCount === 1 ? "y" : "ies"}. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmBulkDelete}
        confirming={pending}
      />
    </div>
  );
}
