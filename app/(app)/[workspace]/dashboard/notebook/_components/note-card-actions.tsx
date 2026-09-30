"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Archive, MoreHorizontal, Star, Trash2 } from "@/lib/icons";
import { cn } from "@/lib/utils";

import {
  deleteNoteAction,
  toggleArchiveAction,
  toggleFavoriteAction,
} from "../actions";

interface NoteCardActionsProps {
  workspaceDomain: string;
  nanoid: string;
  title: string;
  favorite: boolean;
  archived: boolean;
  /** `icon` for a card (star + kebab), `full` for the detail header. */
  variant?: "icon" | "full";
  className?: string;
}

/**
 * The only client island on a note card.
 *
 * The card itself is a Server Component — title, excerpt, tags, and dates are
 * all known at render time. Interactivity is confined to these buttons, so
 * the list ships this small island rather than a 450-line client component
 * wrapping the entire grid.
 *
 * Favorite and archive post through `<form action>` Server Actions and work
 * without JS. Delete is destructive and therefore gated behind
 * `ConfirmDialog` (AGENTS.md §8) rather than firing on the click.
 */
export function NoteCardActions({
  workspaceDomain,
  nanoid,
  title,
  favorite,
  archived,
  variant = "icon",
  className,
}: NoteCardActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function hidden() {
    return (
      <>
        <input type="hidden" name="workspace_domain" value={workspaceDomain} />
        <input type="hidden" name="nanoid" value={nanoid} />
      </>
    );
  }

  function payload(): FormData {
    const fd = new FormData();
    fd.set("workspace_domain", workspaceDomain);
    fd.set("nanoid", nanoid);
    return fd;
  }

  // The Server Action already revalidates; refreshing re-runs the Server
  // Component so the list reflects the new flag without a full navigation.
  function refresh() {
    startTransition(() => router.refresh());
  }

  const confirmDialog = (
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title="Delete this note?"
      description={`“${title}” will be permanently removed. This cannot be undone.`}
      confirmLabel="Delete note"
      variant="destructive"
      onConfirm={() => deleteNoteAction(payload())}
    />
  );

  if (variant === "full") {
    return (
      <>
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
          <form action={toggleFavoriteAction} onSubmit={refresh}>
            {hidden()}
            <button
              type="submit"
              disabled={pending}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors disabled:opacity-50",
                favorite
                  ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
                  : "border-border bg-background hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Star size={14} fill={favorite ? "currentColor" : "none"} />
              {favorite ? "Starred" : "Star"}
            </button>
          </form>

          <form action={toggleArchiveAction} onSubmit={refresh}>
            {hidden()}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              <Archive size={14} />
              {archived ? "Restore" : "Archive"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>

        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <div
        className={cn("flex items-center gap-0.5", className)}
        // The whole card is a Link, so without this a click on a button would
        // toggle *and* navigate.
        onClick={(e) => e.stopPropagation()}
      >
        <form action={toggleFavoriteAction} onSubmit={refresh}>
          {hidden()}
          <button
            type="submit"
            aria-label={favorite ? `Unstar ${title}` : `Star ${title}`}
            title={favorite ? "Starred" : "Star"}
            disabled={pending}
            className={cn(
              "rounded-md p-1.5 transition-colors disabled:opacity-50",
              favorite
                ? "text-amber-500 hover:bg-amber-500/10"
                : "text-muted-foreground/60 hover:bg-muted hover:text-foreground",
            )}
          >
            <Star size={15} fill={favorite ? "currentColor" : "none"} />
          </button>
        </form>

        <KebabMenu
          archived={archived}
          disabled={pending}
          onArchive={() => toggleArchiveAction(payload()).then(refresh)}
          onDelete={() => setConfirmOpen(true)}
        />
      </div>

      {confirmDialog}
    </>
  );
}

interface KebabMenuProps {
  archived: boolean;
  disabled: boolean;
  onArchive: () => void;
  onDelete: () => void;
}

/**
 * Archive and delete collapsed behind a kebab, so a card shows two icons
 * instead of three and the default state stays calm.
 *
 * Dismissal is handled by a full-bleed transparent sheet behind the menu
 * rather than a `keydown` listener, so it closes on a click anywhere —
 * including on the backdrop — without leaving the menu stranded open.
 */
function KebabMenu({
  archived,
  disabled,
  onArchive,
  onDelete,
}: KebabMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <MoreHorizontal size={15} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
          >
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                setOpen(false);
                onArchive();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              <Archive size={13} />
              {archived ? "Restore note" : "Archive note"}
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
            >
              <Trash2 size={13} />
              Delete note
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
