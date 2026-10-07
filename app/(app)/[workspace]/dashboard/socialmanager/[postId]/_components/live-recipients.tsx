"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Loader2,
  Trash2,
} from "@/lib/icons";
import { PlatformGlyph, usePlatformStyleResolver } from "@/components/platform-icon";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { formatMediumDateTime } from "@/lib/dates";
import type { ManagedChannel, PostRecipient } from "@/lib/api/types";
import { pushRecipientDeleteAction, pushRecipientUpdateAction } from "../../actions";
import { waitForLiveTask } from "./live-task";
import { RecipientEditDialog } from "./recipient-edit-dialog";

/**
 * A recipient whose copy is actually on a Page right now.
 *
 * `published` alone is not enough: a row can read as published from an earlier
 * attempt while `external_post_id` was never filled in, and there is nothing on
 * Meta to edit or delete in that case. Offering the buttons would queue a task
 * that can only come back refused.
 */
export function isLiveCopy(recipient: PostRecipient): boolean {
  return recipient.status === "published" && Boolean(recipient.external_post_id);
}

interface LiveRecipientsProps {
  recipients: PostRecipient[];
  workspace: string;
  /** Channels keyed by nanoid — the recipient carries only a display name, so
   *  the platform (and therefore the glyph) can only come from the channel. */
  pageByNanoid: Map<string, ManagedChannel>;
  /** The parent re-reads the post so this card renders what the task wrote.
   *  Required on failure too: a refusal leaves the row untouched, and showing
   *  that is how the user learns nothing changed. */
  onChanged: () => void;
}

/**
 * Per-page controls for a post that is already live: edit its copy, or delete
 * it from one page.
 *
 * Every operation here is asynchronous. The action queues a Celery task, the
 * platform is called, and only then is our row written — so this card never
 * claims success optimistically. It polls, refreshes, and reports Meta's own
 * refusal verbatim, which is the only way to explain why an edit did not take
 * effect.
 *
 * Deleting the whole post (every page at once) lives in the page's Delete
 * action, not here; this card is for the case where one page should lose the
 * post and the others keep it.
 */
export function LiveRecipients({
  recipients,
  workspace,
  pageByNanoid,
  onChanged,
}: LiveRecipientsProps) {
  const styleOf = usePlatformStyleResolver();
  const { brandOf } = usePlatformBrand();

  const [editing, setEditing] = useState<PostRecipient | null>(null);
  const [confirming, setConfirming] = useState<PostRecipient | null>(null);
  /** The row a task is running for. Anything else is disabled meanwhile: two
   *  edits against one post would race to write the same row last. */
  const [pendingNanoid, setPendingNanoid] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const live = recipients.filter(isLiveCopy);
  if (!live.length) return null;

  const runTask = async (
    start: Promise<{ status: string; task_id?: string; message?: string }>,
    target: PostRecipient,
    successMessage: string,
  ): Promise<void> => {
    setError(null);
    setNotice(null);
    setPendingNanoid(target.nanoid);
    const queued = await start;
    if (queued.status === "error" || !queued.task_id) {
      setError(queued.message ?? "Could not reach the platform.");
      setSubmitting(false);
      setPendingNanoid(null);
      return;
    }

    const outcome = await waitForLiveTask(queued.task_id, workspace);
    setPendingNanoid(null);
    setSubmitting(false);
    onChanged();

    if (!outcome.ok) {
      setError(outcome.failure);
      return;
    }
    setEditing(null);
    setConfirming(null);
    setNotice(
      outcome.warnings.length
        ? outcome.warnings.join(" ")
        : successMessage,
    );
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Published copies
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            These are live on the platform. Editing or deleting here changes what
            the audience sees on that page only.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
          {live.length} live
        </span>
      </div>

      {error ? (
        <div className="mb-3 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="mb-3 flex items-start gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          {notice}
        </div>
      ) : null}

      <ul className="divide-y divide-neutral-100">
        {live.map((recipient) => {
          const page = pageByNanoid.get(recipient.managed_page);
          const style = styleOf(page?.platform);
          const busy = pendingNanoid === recipient.nanoid;
          return (
            <li
              key={recipient.nanoid}
              className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold ${style.bg} ${style.border} ${style.color}`}
              >
                {page?.platform ? (
                  <PlatformGlyph platform={brandOf(page.platform)} size="sm" />
                ) : null}
                {page?.platform_name || recipient.managed_page_name}
              </span>

              <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">
                {recipient.content?.trim()
                  ? recipient.content
                  : "Published without a caption."}
              </span>

              {recipient.published_at ? (
                <span className="text-[11px] text-neutral-400">
                  {formatMediumDateTime(recipient.published_at)}
                </span>
              ) : null}

              <span className="flex shrink-0 items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={Boolean(pendingNanoid)}
                  onClick={() => {
                    setError(null);
                    setNotice(null);
                    setEditing(recipient);
                  }}
                >
                  <Edit3 className="size-3.5" />
                  {busy ? "Updating…" : "Edit"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                  disabled={Boolean(pendingNanoid)}
                  onClick={() => {
                    setError(null);
                    setNotice(null);
                    setConfirming(recipient);
                  }}
                >
                  {busy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Delete
                </Button>
              </span>
            </li>
          );
        })}
      </ul>

      <RecipientEditDialog
        open={Boolean(editing)}
        recipient={editing}
        submitting={submitting}
        error={error}
        onClose={() => {
          setEditing(null);
          setError(null);
        }}
        onSubmit={(content) => {
          if (!editing) return;
          setSubmitting(true);
          void runTask(
            pushRecipientUpdateAction(editing.nanoid, content, workspace),
            editing,
            `Updated the post on ${editing.managed_page_name}.`,
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(confirming)}
        onOpenChange={(next) => {
          if (!next && !submitting) setConfirming(null);
        }}
        title="Delete this page's copy?"
        description={
          confirming
            ? `This removes the post from ${confirming.managed_page_name}. Other pages keep theirs. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="destructive"
        confirming={submitting}
        onConfirm={() => {
          if (!confirming) return;
          setSubmitting(true);
          void runTask(
            pushRecipientDeleteAction(confirming.nanoid, workspace),
            confirming,
            `Deleted the post from ${confirming.managed_page_name}.`,
          );
        }}
      />
    </Card>
  );
}
