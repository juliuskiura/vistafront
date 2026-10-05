"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  deletePostCommentAction,
  editPostCommentAction,
  hidePostCommentAction,
} from "@/app/(app)/[workspace]/dashboard/socialmanager/actions";
import { commentModerationStatus } from "@/lib/api";
import { Eye, EyeOff, Pencil, Trash2 } from "@/lib/icons";

/** How long to wait between task polls, and when to give up. */
const POLL_INTERVAL_MS = 1500;
const POLL_ATTEMPTS = 20;

/**
 * Block until a moderation task settles.
 *
 * The backend reaches Meta *before* it writes our row, so "the row has not
 * changed yet" is not evidence of failure — it is evidence the call is still in
 * flight. Polling here is what makes the refresh afterwards mean something.
 *
 * Returns the error string when the task failed, so the caller can surface
 * Meta's own refusal rather than a generic message. A task that never settles is
 * treated as a timeout, not a success.
 */
async function waitForTask(
  taskId: string,
  workspace: string,
): Promise<string | null> {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    try {
      const status = await commentModerationStatus(taskId, workspace);
      const settled = status?.result;
      if (settled?.status === "success") return null;
      if (settled?.status === "failed") {
        return settled.error || "Meta refused the change.";
      }
    } catch {
      /* transient poll failure — try again until we run out of attempts */
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return "Still processing on the platform. Refresh in a moment to see the result.";
}

/**
 * Per-comment moderation controls: edit, hide/unhide and delete.
 *
 * Three platform facts drive everything here, and each one removes an option
 * rather than adding a warning:
 *
 * 1. **Instagram has no comment-edit operation at all.** The backend raises
 *    `not_supported` for it, so Edit is only offered on a Facebook channel.
 *    Offering it elsewhere would ship a button that cannot work.
 * 2. **Hiding is reversible, delete is not.** So the two are separate controls,
 *    delete goes through `ConfirmDialog`, and hiding is the one an agent should
 *    reach for by default.
 * 3. **Every operation is async.** The action queues a Celery task and returns
 *    before the platform has been called, so the UI shows a pending state and
 *    then refreshes. It never claims success optimistically — a hide that Meta
 *    refuses must be visible as a failure, not silently reverted.
 *
 * The channel is resolved from the comment's own `managed_page`, not the post's
 * first recipient: a post published to a Facebook Page and an Instagram account
 * has one recipient each, and reading the wrong one would offer Edit on an
 * Instagram comment.
 */
export function CommentModeration({
  commentNanoid,
  workspace,
  platform,
  isHidden,
  canModerate,
  isOwnComment,
  onChanged,
}: {
  commentNanoid: string;
  workspace: string;
  /** The connect door slug for this comment's channel, e.g. "facebook". */
  platform: string | undefined;
  isHidden: boolean;
  /** False when the comment has no platform id, so there is nothing to address. */
  canModerate: boolean;
  /** True for a comment this workspace wrote. Instagram cannot hide those. */
  isOwnComment: boolean;
  /** Called after a change is applied so the caller can refetch the thread. */
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Instagram publishes no comment-edit operation, so there is nothing to
  // offer. Facebook Page comments can be edited.
  const canEdit = canModerate && platform === "facebook";

  // Neither platform lets you hide a comment the account itself wrote.
  // Instagram documents it (a comment the media owner wrote stays visible even
  // at hide=true), and Facebook refuses the endpoint outright — verified live
  // 2026-10-05: `POST /{comment-id} is_hidden=true|false` answers 403
  // `(#200) Can not hide or unhide this comment`, and `can_hide` is `false` on
  // exactly those comments. Offering the button there means the user waits out
  // the poll and then reads Meta's raw refusal string. Delete is unaffected —
  // `can_remove` is `true` on our own comments — which is why this failed in a
  // way that looked selective.
  const canHide = canModerate && !isOwnComment;

  // Nothing to offer: the comment never reached the platform, so there is
  // no object to hide, edit or delete on the Page.
  if (!canModerate) return null;
  const run = async (work: () => Promise<{ status: string; task_id?: string; message?: string }>) => {
    setError(null);
    const result = await work();
    if (result.status === "error") {
      setError(result.message ?? "That did not work.");
      return;
    }

    setEditing(false);
    setDeleteOpen(false);

    // The action only *queued* the platform call. Refetching immediately would
    // re-read a row the task has not written yet, so the UI would look like
    // nothing happened. Poll until the task settles, then refresh — and report
    // Meta's refusal if it refuses.
    if (result.task_id) {
      const failure = await waitForTask(result.task_id, workspace);
      if (failure) {
        setError(failure);
        onChanged?.();
        router.refresh();
        return;
      }
    }

    onChanged?.();
    router.refresh();
  };

  const submitEdit = () =>
    startTransition(async () => {
      await run(() => editPostCommentAction(commentNanoid, draft, workspace));
    });

  const toggleHide = () =>
    startTransition(async () => {
      await run(() => hidePostCommentAction(commentNanoid, !isHidden, workspace));
    });

  const confirmDelete = () =>
    startTransition(async () => {
      await run(() => deletePostCommentAction(commentNanoid, workspace));
    });

  return (
    <>
      <div className="flex items-center gap-1">
        {canEdit && !editing && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              setDraft("");
              setEditing(true);
            }}
            className="h-7 gap-1 px-2 text-xs text-neutral-600"
          >
            <Pencil className="size-3" />
            Edit
          </Button>
        )}

        {canHide && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={toggleHide}
            className="h-7 gap-1 px-2 text-xs text-neutral-600"
          >
            {isHidden ? (
              <>
                <Eye className="size-3" />
                Unhide
              </>
            ) : (
              <>
                <EyeOff className="size-3" />
                Hide
              </>
            )}
          </Button>
        )}

        {canModerate && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setDeleteOpen(true)}
            className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3" />
            Delete
          </Button>
        )}
      </div>

      {editing && (
        <div className="mt-2 space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            maxLength={5000}
            autoFocus
            placeholder="Edit this comment"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={pending || !draft.trim()}
              onClick={submitEdit}
              className="h-7 px-3 text-xs"
            >
              {pending ? "Saving…" : "Save on Facebook"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setEditing(false)}
              className="h-7 px-3 text-xs"
            >
              Cancel
            </Button>
            <span className="text-[11px] text-neutral-400">
              Changes the comment on the Page, not just here.
            </span>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this comment?"
        description={
          "This removes the comment from the platform. On Facebook and Instagram it cannot be undone — prefer Hide, which can be reversed."
        }
        confirmLabel={pending ? "Deleting…" : "Delete comment"}
        variant="destructive"
        confirming={pending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
