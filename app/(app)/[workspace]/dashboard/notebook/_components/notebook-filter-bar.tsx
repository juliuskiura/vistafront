"use client";

import { LayoutGrid, List, Search } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { NoteTypeOption } from "@/lib/api";

import {
  NOTE_ORDERINGS,
  type NoteOrdering,
} from "../action-state";
import { useNotebookViewState } from "./use-notebook-view-state";
import { TypeSwatch } from "./type-swatch";

interface NotebookFilterBarProps {
  noteTypes: NoteTypeOption[];
  totalCount: number;
}

/**
 * Search, type filter, archived toggle, sort, and the grid/rows view switch.
 *
 * Type filtering is a row of tinted chips rather than a `<select>`. Each
 * chip carries the note type's own colour, so the filter doubles as a legend
 * for the accent rules on the cards — the same colour means the same thing
 * everywhere on the page.
 *
 * Counts come from the notes already fetched on the server, not from a
 * per-type endpoint: a chip shows how many notes of that type are on the
 * current page. That is honest about its own limit — it is not the
 * workspace-wide total, and it is not labelled as one.
 */
export function NotebookFilterBar({
  noteTypes,
  totalCount,
}: NotebookFilterBarProps) {
  const { filters, view, setParams, pending } = useNotebookViewState();

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get("search") ?? "");
    setParams({ search: value.trim() || null });
  }

  const sortedTypes = [...noteTypes].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Type chips ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <TypeChip
          active={!filters.noteType}
          label="All notes"
          count={totalCount}
          onClick={() => setParams({ note_type: null })}
        />

        {sortedTypes.map((type) => (
          <TypeChip
            key={type.nanoid}
            active={filters.noteType === String(type.key)}
            label={type.name}
            type={type}
            onClick={() =>
              setParams({
                note_type:
                  filters.noteType === String(type.key) ? null : String(type.key),
              })
            }
          />
        ))}
      </div>

      {/* ── Search · sort · archived · view ─────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={submitSearch} className="relative min-w-[200px] flex-1">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          {/* Uncontrolled, remounted when the URL's `search` changes. That
              keeps the field in step with a back-navigation or a "Clear
              filters" link without an effect that writes state on every
              render. */}
          <input
            key={filters.search}
            type="search"
            name="search"
            defaultValue={filters.search}
            placeholder="Search notes…"
            aria-label="Search notes"
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </form>

        <select
          value={filters.ordering}
          disabled={pending}
          aria-label="Sort notes"
          onChange={(e) =>
            setParams({ ordering: e.target.value as NoteOrdering })
          }
          className="h-8 rounded-md border border-input bg-background px-2 text-sm transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
        >
          {NOTE_ORDERINGS.map((value) => (
            <option key={value} value={value}>
              {ORDERING_LABELS[value]}
            </option>
          ))}
        </select>

        <button
          type="button"
          aria-pressed={filters.archived}
          disabled={pending}
          onClick={() =>
            setParams({ archived: filters.archived ? null : "true" })
          }
          className={cn(
            "h-8 rounded-md border px-2.5 text-sm transition-colors disabled:opacity-50",
            filters.archived
              ? "border-primary bg-primary/10 font-medium text-primary"
              : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
          )}
        >
          Archived
        </button>

        <div
          role="group"
          aria-label="View mode"
          className="ml-auto flex items-center rounded-md border p-0.5"
        >
          <ViewButton
            active={view === "grid"}
            onClick={() => setParams({ view: "grid" })}
            label="Grid view"
          >
            <LayoutGrid size={14} />
          </ViewButton>
          <ViewButton
            active={view === "rows"}
            onClick={() => setParams({ view: "rows" })}
            label="List view"
          >
            <List size={14} />
          </ViewButton>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

interface TypeChipProps {
  label: string;
  active: boolean;
  count?: number;
  type?: NoteTypeOption;
  onClick: () => void;
}

function TypeChip({ label, active, count, type, onClick }: TypeChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary/10 text-primary shadow-xs"
          : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground",
      )}
    >
      {type ? <TypeSwatch type={type} fallback={label} variant="dot" /> : null}
      {label}
      {typeof count === "number" ? (
        <span
          className={cn(
            "tabular-nums",
            active ? "text-primary/70" : "text-muted-foreground/70",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-xs"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

const ORDERING_LABELS: Record<NoteOrdering, string> = {
  "-updated_at": "Recently updated",
  updated_at: "Oldest updated",
  "-created_at": "Newest created",
  title: "Title A–Z",
  "-title": "Title Z–A",
  note_type: "Type A–Z",
  "-note_type": "Type Z–A",
  favorite: "Not starred first",
  "-favorite": "Starred first",
};
