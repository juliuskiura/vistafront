"use client";

import { useMemo, useState } from "react";

import type { ManagedChannel, PostRecipient } from "@/lib/api/types";
import {
  AlertTriangle,
  CheckCircle2,
  CornerDownRight,
  Edit3,
  ExternalLink,
  Loader2,
  Maximize2,
  Trash2,
} from "@/lib/icons";
import { STATUS_STYLES } from "@/components/socialmanager/platform-gradients";
import { usePlatformStyleResolver } from "@/components/platform-icon";
import { SocialIconSolid } from "@/components/social-icons";
import { ChannelAvatar } from "@/components/socialmanager/channel-avatar";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { deliveryGuidance, elapsedSince } from "@/lib/social/delivery-error";
import { formatMediumDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RecipientEditDialog } from "./recipient-edit-dialog";
import { isLiveCopy, waitForLiveTask } from "./recipient-utils";
import {
  pushRecipientDeleteAction,
  pushRecipientUpdateAction,
} from "../../actions";
import { PlatformPostSheet } from "./platform-post-sheet";

import { RecipientRow } from "./recipient-row";

/**
 * The "child posts" tree: one row per channel the master post reached.
 *
 * Each live recipient row carries inline Edit and Delete buttons when an
 * `onChanged` callback is supplied — the post detail page wires it so the
 * parent re-reads the post after the platform call settles. The unified
 * feed passes no callback, so rows there stay read-only behind their link
 * overlay.
 *
 * The live-copy controls mirror `LiveRecipients` on the detail page: every
 * operation hits the platform first via a Celery task, so the row never
 * claims success optimistically. It polls, refreshes, and reports the
 * platform's refusal verbatim.
 */
export function FeedRecipientRows({
  recipients,
  pagesById,
  workspace,
  onChanged,
}: {
  recipients: PostRecipient[];
  pagesById: Record<string, ManagedChannel>;
  workspace: string;
  /** When provided, live recipient rows gain inline Edit/Delete controls that
   *  reach the platform. When absent, rows are read-only. */
  onChanged?: () => void;
}) {
  const needsAttention = useMemo(
    () =>
      recipients.some((r) => r.status === "failed" || r.status === "processing"),
    [recipients],
  );

  const interactive = Boolean(onChanged);
  const [editing, setEditing] = useState<PostRecipient | null>(null);
  const [confirming, setConfirming] = useState<PostRecipient | null>(null);
  const [viewing, setViewing] = useState<PostRecipient | null>(null);
  const [pendingNanoid, setPendingNanoid] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    onChanged?.();

    if (!outcome.ok) {
      setError(outcome.failure);
      return;
    }
    setEditing(null);
    setConfirming(null);
    setNotice(
      outcome.warnings.length ? outcome.warnings.join(" ") : successMessage,
    );
  };

  const handleEdit = (recipient: PostRecipient) => {
    setError(null);
    setNotice(null);
    setEditing(recipient);
  };

  const handleDelete = (recipient: PostRecipient) => {
    setError(null);
    setNotice(null);
    setConfirming(recipient);
  };

  const handleView = (recipient: PostRecipient) => {
    setError(null);
    setNotice(null);
    setViewing(recipient);
  };

  const onEdit = interactive ? handleEdit : undefined;
  const onDelete = interactive ? handleDelete : undefined;
  const onView = interactive ? handleView : undefined;

  return (
    <div className="mt-4">
      <div className="relative ml-5 space-y-3 border-l-2 border-indigo-200 py-1 pl-6 sm:pl-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <CornerDownRight className="size-3.5 text-indigo-400" />
            {recipients.length} child post{recipients.length === 1 ? "" : "s"} shared
            to networks
          </span>
          {needsAttention && (
            <span className="text-[11px] font-bold text-amber-600">
              Needs attention
            </span>
          )}
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

        <ul className="space-y-2.5">
          {recipients.map((recipient) => (
             <RecipientRow
                key={recipient.nanoid}
                recipient={recipient}
                page={pagesById[recipient.managed_page]}
                workspace={workspace}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
                pendingNanoid={pendingNanoid}
              />
          ))}
        </ul>
      </div>

      {interactive && editing && (
        <RecipientEditDialog
          open={Boolean(editing)}
          recipient={editing}
          page={editing ? pagesById[editing.managed_page] : undefined}
          workspace={workspace}
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
      )}

      {interactive && confirming && (
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
      )}

      {interactive && editing && (
        <PlatformPostSheet
          post={editing}
          pageById={{ [editing.managed_page]: pagesById[editing.managed_page] }}
          workspace={workspace}
          open={Boolean(editing) || Boolean(confirming)}
          onOpenChange={(open) => {
            if (!open) {
              setEditing(null);
              setConfirming(null);
            }
          }}
          platformPostUrl={editing?.link_url}
        />
      )}

      {interactive && confirming && (
        <PlatformPostSheet
          post={confirming}
          pageById={{ [confirming.managed_page]: pagesById[confirming.managed_page] }}
          workspace={workspace}
          open={Boolean(editing) || Boolean(confirming)}
          onOpenChange={(open) => {
            if (!open) {
              setEditing(null);
              setConfirming(null);
            }
          }}
          platformPostUrl={confirming?.link_url}
        />
      )}

      {viewing && (
        <PlatformPostSheet
          post={viewing}
          pageById={{ [viewing.managed_page]: pagesById[viewing.managed_page] }}
          workspace={workspace}
          open={Boolean(viewing)}
          onOpenChange={(open) => {
            if (!open) setViewing(null);
          }}
          platformPostUrl={viewing?.link_url}
        />
      )}
    </div>
  );
}
