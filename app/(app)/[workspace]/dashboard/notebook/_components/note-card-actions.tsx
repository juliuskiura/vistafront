"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import {
  deleteNoteAction,
  toggleArchiveAction,
  toggleFavoriteAction,
} from "../actions";
import { QuickToolsMenu } from "./note-actions-menu";

interface NoteCardActionsProps {
  workspaceDomain: string;
  nanoid: string;
  title: string;
  favorite: boolean;
  archived: boolean;
  /** `icon` for a card, `full` for the detail header. */
  variant?: "icon" | "full";
  className?: string;
}

/**
 * The only client island on a note.
 *
 * The card and the detail page are Server Components — title, excerpt, tags,
 * and dates are all known at render time. Interactivity is confined to this
 * menu, so the list ships this small island rather than a client component
 * wrapping the entire grid.
 *
 * All three actions post through `<form action>` Server Actions and work
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

  return (
    <>
      <QuickToolsMenu
        archived={archived}
        favorite={favorite}
        disabled={pending}
        compact={variant === "icon"}
        className={className}
        onStar={() => toggleFavoriteAction(payload()).then(refresh)}
        onArchive={() => toggleArchiveAction(payload()).then(refresh)}
        onDelete={() => setConfirmOpen(true)}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this note?"
        description={`“${title}” will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete note"
        variant="destructive"
        onConfirm={() => deleteNoteAction(payload())}
      />
    </>
  );
}
