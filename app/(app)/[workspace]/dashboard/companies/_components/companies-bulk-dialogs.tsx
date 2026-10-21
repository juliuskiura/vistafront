"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Props {
  /** How many companies the user has selected. */
  selectedCount: number;
  /** A mutation is running — the buttons show a "please wait" state. */
  pending: boolean;
  deleteOpen: boolean;
  archiveOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  onArchiveOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  onConfirmArchive: () => void;
}

/**
 * The confirmation dialogs for the bulk actions.
 *
 * Two very different promises, so two dialogs: "Delete" takes the records
 * away for good, while "Archive" only moves them out of the working lists —
 * every field is kept and the companies can be restored later.
 */
export function CompaniesBulkDialogs({
  selectedCount,
  pending,
  deleteOpen,
  archiveOpen,
  onDeleteOpenChange,
  onArchiveOpenChange,
  onConfirmDelete,
  onConfirmArchive,
}: Props) {
  const company = selectedCount === 1 ? "company" : "companies";
  const pronoun = selectedCount === 1 ? "it" : "them";

  return (
    <>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={onDeleteOpenChange}
        title="Delete companies?"
        description={`This will permanently delete ${selectedCount} ${company}. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={onConfirmDelete}
        confirming={pending}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={onArchiveOpenChange}
        title="Archive companies?"
        description={`${selectedCount} ${company} and every record that belongs to ${pronoun} will leave the working lists. Nothing is deleted — you can restore ${pronoun} at any time.`}
        confirmLabel="Archive"
        onConfirm={onConfirmArchive}
        confirming={pending}
      />
    </>
  );
}
