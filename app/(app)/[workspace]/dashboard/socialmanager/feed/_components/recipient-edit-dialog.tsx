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
import type { ManagedChannel, PostRecipient } from "@/lib/api/types";
import { SocialIconSolid } from "@/components/social-icons";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { ChannelAvatar } from "@/components/socialmanager/channel-avatar";

interface RecipientEditDialogProps {
  open: boolean;
  /** The published copy being edited. Read for the seed value and the page
   *  name only — the actual write goes through the parent's Server Action. */
  recipient: PostRecipient | null;
  /** The managed channel this recipient belongs to, for platform/avatar icon. */
  page?: ManagedChannel;
  workspace: string;
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
  page,
  workspace,
  submitting,
  error,
  onClose,
  onSubmit,
}: RecipientEditDialogProps) {
  const { brandOf } = usePlatformBrand();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // A task in flight owns the row: closing mid-flight would let the user
        // reopen and queue a second edit against the same post.
        if (!next && !submitting) onClose();
      }}
    >
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
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
            page={page}
            workspace={workspace}
            brandOf={brandOf}
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
  page,
  workspace,
  brandOf,
  submitting,
  error,
  onCancel,
  onSubmit,
}: {
  recipient: PostRecipient;
  page?: ManagedChannel;
  workspace: string;
  brandOf: (platform?: string) => string | undefined;
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
        <span className="inline-flex items-center gap-1.5">
          {page ? (
            <span className="relative shrink-0">
              <ChannelAvatar
                nanoid={page.nanoid}
                pictureUrl={page.profile_picture_url ?? ""}
                workspace={workspace}
                className="size-5 rounded-full object-cover ring-1 ring-black/5"
                fallback={
                  <span className="flex size-5 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-500 ring-1 ring-black/5">
                    {recipient.managed_page_name.slice(0, 1).toUpperCase()}
                  </span>
                }
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-white ring-1 ring-black/5">
                <SocialIconSolid name={brandOf(page.platform)} className="size-5" />
              </span>
            </span>
          ) : null}
          <span className="font-semibold text-neutral-900">
            {recipient.managed_page_name}
          </span>
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
