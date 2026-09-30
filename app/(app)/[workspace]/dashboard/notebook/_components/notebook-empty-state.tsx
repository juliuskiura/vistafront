import Link from "next/link";

import { FileText, Search } from "@/lib/icons";

interface NotebookEmptyStateProps {
  /** Distinguishes "no notes exist" from "your filters excluded everything". */
  reason: "no-notes" | "no-results" | "no-archived";
  search: string;
  noteTypeName?: string;
  onCompose?: () => void;
  clearHref: string;
}

/**
 * Shown when a note list renders no items.
 *
 * The three cases get different copy because they need different actions:
 * an empty workspace needs a way to start writing, whereas an empty search
 * result needs a way to clear the filters. Telling a user "no notes yet" when
 * they have 400 notes and one too-narrow filter is the failure this avoids.
 */
export function NotebookEmptyState({
  reason,
  search,
  noteTypeName,
  onCompose,
  clearHref,
}: NotebookEmptyStateProps) {
  if (reason === "no-results") {
    return (
      <Shell
        icon={<Search size={20} />}
        title="No matching notes"
        body={
          <>
            Nothing matches{" "}
            {search ? <strong className="font-medium text-foreground">“{search}”</strong> : "the current filters"}
            {noteTypeName ? ` in ${noteTypeName}` : ""}. Try a different search or
            clear the filters.
          </>
        }
      >
        <Link
          href={clearHref}
          className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Clear filters
        </Link>
      </Shell>
    );
  }

  if (reason === "no-archived") {
    return (
      <Shell
        icon={<FileText size={20} />}
        title="Nothing archived"
        body="Notes you archive are kept here. You have not archived any notes yet."
      >
        <Link
          href={clearHref}
          className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          View active notes
        </Link>
      </Shell>
    );
  }

  return (
    <Shell
      icon={<FileText size={20} />}
      title="No notes yet"
      body="Capture meeting notes, ideas, and SOPs here. Your first note takes a title and a type."
    >
      {onCompose ? (
        <button
          type="button"
          onClick={onCompose}
          className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          Write the first note
        </button>
      ) : null}
    </Shell>
  );
}

function Shell({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 border-t border-[var(--nb-rule)] px-2 py-16 text-center">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {body}
        </p>
      </div>
      {children}
    </div>
  );
}
