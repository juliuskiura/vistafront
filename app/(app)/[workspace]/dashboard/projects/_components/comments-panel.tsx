"use client";

import { useActionState, useState } from "react";

import type { Comment } from "@/lib/api";
import { formatMediumDateTime } from "@/lib/dates";
import { MessageSquare, Trash2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { createCommentAction, deleteCommentAction } from "../actions/comment-actions";
import { initialProjectActionState } from "../action-state";

interface Props {
  /** The backend's short model name for the record being discussed. */
  targetType: "project" | "task";
  targetNanoid: string;
  comments: Comment[];
  workspaceDomain: string;
  title?: string;
}

/**
 * A comment thread on a record.
 *
 * Comments are a generic backend feature: the record is addressed by a
 * target type and a nanoid, so the same panel serves the project and the
 * task page.
 */
export function CommentsPanel({
  targetType,
  targetNanoid,
  comments,
  workspaceDomain,
  title = "Discussion",
}: Props) {
  const [state, formAction, pending] = useActionState(
    createCommentAction,
    initialProjectActionState,
  );
  const [text, setText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clear the box once the comment is posted. Adjusting during render is
  // React's own way to react to a changed value without a second paint.
  const [lastStatus, setLastStatus] = useState(state.status);
  if (state.status !== lastStatus) {
    setLastStatus(state.status);
    if (state.status === "success") setText("");
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No comments yet. Start the conversation below.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.nanoid} className="flex items-start gap-3">
              <MessageSquare
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  {comment.author_name ?? "Someone"} ·{" "}
                  {formatMediumDateTime(comment.created_at)}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm">
                  {comment.text}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget(comment)}
                aria-label={`Delete the comment by ${comment.author_name ?? "someone"}`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <form action={formAction} className="space-y-2">
        <input type="hidden" name="workspace_domain" value={workspaceDomain} />
        <input type="hidden" name="target_type" value={targetType} />
        <input type="hidden" name="target_nanoid" value={targetNanoid} />
        <Textarea
          name="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          placeholder="Write a comment…"
          aria-label="Comment"
        />
        {state.status === "error" && state.message ? (
          <p className="text-xs text-destructive">{state.message}</p>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending || !text.trim()}>
            {pending ? "Posting…" : "Post comment"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this comment?"
        description="The comment is removed from the thread. This cannot be undone."
        confirmLabel="Delete comment"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          const result = await deleteCommentAction({
            workspaceDomain,
            nanoid: deleteTarget.nanoid,
          });
          if (result.status === "error") {
            setError(result.message ?? "The comment could not be deleted.");
          }
        }}
      />
    </div>
  );
}
