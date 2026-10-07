"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "@/lib/icons";
import type { PostRecipient } from "@/lib/api/types";

interface RecipientEditDialogProps {
  open: boolean;
  /** The published copy being edited. Read for the seed value and the page
   *  name only — the actual write goes through the parent's Server Action. */
  recipient: PostRecipient | null;
  submitting: boolean;
  /** A refusal from the platform, kept in the parent so it survives a
   *  re-render while the task is still being polled. */
  error: string | null;
  onClose: () => void;
  onSubmit: (content: string) => void;
}

/**
 * Edit the copy of a post that is already live on one Page.
 *
 * Deliberately *not* the composer: this changes what Meta currently serves for
 * an existing post, so it takes one page's text and nothing else — no media, no
 * recipients, no schedule. Editing those means editing the master copy from the
 * compose route, which is a different operation with a different blast radius.
 */
export function RecipientEditDialog({
  open,
  recipient,
  submitting,
  error,
  onClose,
  onSubmit,
}: RecipientEditDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // A task in flight owns the row: closing mid-flight would let the user
        // reopen and queue a second edit against the same post.
        if (!next && !submitting) onClose();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit page copy</DialogTitle>
          <DialogDescription>
            Changes what readers see on this page. Other pages keep the copy they
            were published with.
          </DialogDescription>
        </DialogHeader>

        {/* Mounted only while open, so the field starts from the row's current
            text on every open rather than from whatever was typed last time. */}
        {open && recipient ? (
          <EditForm
            key={recipient.nanoid}
            recipient={recipient}
            submitting={submitting}
            error={error}
            onCancel={onClose}
            onSubmit={onSubmit}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  recipient,
  submitting,
  error,
  onCancel,
  onSubmit,
}: {
  recipient: PostRecipient;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (content: string) => void;
}) {
  const [value, setValue] = useState(recipient.content ?? "");
  const empty = !value.trim();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (empty || submitting) return;
        onSubmit(value);
      }}
    >
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
        <span className="font-semibold text-neutral-900">
          {recipient.managed_page_name}
        </span>
        {recipient.published_at ? (
          <span className="text-neutral-500"> · published post</span>
        ) : null}
      </div>

      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={7}
        placeholder="Post text…"
        disabled={submitting}
        autoFocus
      />

      {error ? (
        <p className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={empty || submitting}
          className="gap-1.5"
        >
          {submitting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : null}
          {submitting ? "Updating…" : "Update page"}
        </Button>
      </DialogFooter>
    </form>
  );
}
