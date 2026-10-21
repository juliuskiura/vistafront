"use client";

import { Layers, LayoutGrid, ListChecks, Plus, Trash2, X } from "@/lib/icons";
import { Button } from "@/components/ui/button";

interface Props {
  /** How many deliverables the project has. */
  total: number;
  selectedCount: number;
  viewMode: "tree" | "cards";
  onViewModeChange: (mode: "tree" | "cards") => void;
  onAdd: () => void;
  onMerge: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

/**
 * The deliverables tab's toolbar.
 *
 * The view toggle and the "add" button give way to the bulk actions as
 * soon as something is selected — the old app had the same two states,
 * and keeping them apart stops a destructive button from sitting next to
 * a harmless one.
 */
export function DeliverablesToolbar({
  total,
  selectedCount,
  viewMode,
  onViewModeChange,
  onAdd,
  onMerge,
  onBulkDelete,
  onClearSelection,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Deliverables ({total})
        </h2>
        <p className="text-xs text-muted-foreground">
          Manage what this project delivers and where each one stands.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {selectedCount === 0 ? (
          <>
            <div className="flex rounded-lg border p-1 text-xs">
              <button
                type="button"
                onClick={() => onViewModeChange("tree")}
                aria-pressed={viewMode === "tree"}
                className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                  viewMode === "tree"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListChecks className="size-3.5" aria-hidden="true" />
                Tree
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("cards")}
                aria-pressed={viewMode === "cards"}
                className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                  viewMode === "cards"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="size-3.5" aria-hidden="true" />
                Cards
              </button>
            </div>
            <Button size="sm" onClick={onAdd}>
              <Plus className="size-4" aria-hidden="true" />
              Add deliverable
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-2 py-1">
            <span className="px-1 text-xs font-medium uppercase tracking-wide text-primary">
              {selectedCount} selected
            </span>
            {selectedCount >= 2 ? (
              <Button size="sm" variant="ghost" onClick={onMerge}>
                <Layers className="size-4" aria-hidden="true" />
                Merge
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={onBulkDelete}>
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              aria-label="Clear selection"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
