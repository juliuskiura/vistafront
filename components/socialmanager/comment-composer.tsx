"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  createPostCommentAction,
  privateReplyPostCommentAction,
  replyPostCommentAction,
} from "@/app/(app)/[workspace]/dashboard/socialmanager/actions";
import { Lock, Send } from "@/lib/icons";

/**
 * The three ways to answer on a post: a new top-level comment, a public
 * threaded reply, or a private direct reply.
 *
 * They are one component because they are one decision from the user's point of
 * view — "answer this" — and splitting them across three dialogs would make the
 * private option the kind of thing nobody finds.
 *
 * Platform rules are enforced by the backend and quoted back verbatim, because
 * they differ in ways the UI cannot infer:
 *
 * | | Public reply | Private reply |
 * |---|---|---|
 * | Instagram | any comment | one per comment, within **7 days** |
 * | Facebook | any comment | one per comment, window unpublished |
 *
 * So the UI does not pre-judge those windows. It reports what the platform said.
 *
 * Every action queues a Celery task and resolves before the platform is called,
 * so `onQueued` is how the caller learns to refresh and poll — never a resolved
 * promise treated as success.
 */
export function CommentComposer({
  mode,
  workspace,
  commentNanoid,
  recipientNanoid,
  platformName,
  onQueued,
  onCancel,
}: {
  mode: "create" | "reply" | "private";
  workspace: string;
  /** Required for reply and private. */
  commentNanoid?: string;
  /** Required for create — which channel to post to. */
  recipientNanoid?: string;
  /** Shown in the private composer so it is obvious where the message lands. */
  platformName?: string;
  onQueued: () => void;
  onCancel?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const labels = {
    create: { label: "Comment", verb: "Post comment", hint: null },
    reply: {
      label: "Reply",
      verb: "Post reply",
      hint: "Visible to everyone on the post.",
    },
    private: {
      label: "Private reply",
      verb: "Send privately",
      hint: `Sent as a direct message to this person only${
        platformName ? ` via ${platformName}` : ""
      }. Not shown on the post.`,
    },
  } as const;
  const { label, verb, hint } = labels[mode];

  const submit = () => {
    if (!text.trim()) return;
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPostCommentAction(
              recipientNanoid ?? "",
              text,
              workspace,
            )
          : mode === "reply"
            ? await replyPostCommentAction(commentNanoid ?? "", text, workspace)
            : await privateReplyPostCommentAction(
                commentNanoid ?? "",
                text,
                workspace,
              );

      if (result.status === "error") {
        setError(result.message ?? "That did not work.");
        return;
      }
      setText("");
      onQueued();
    });
  };

  const isPrivate = mode === "private";

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={mode === "create" ? 3 : 2}
        maxLength={5000}
        autoFocus
        placeholder={
          isPrivate ? "Write a private message…" : `Add a ${label.toLowerCase()}…`
        }
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />

      {hint && (
        <p className="flex items-start gap-1 text-[11px] text-neutral-500">
          {isPrivate && <Lock className="mt-px size-3 shrink-0" />}
          <span>{hint}</span>
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={pending || !text.trim()}
          onClick={submit}
          className="h-7 gap-1 px-3 text-xs"
        >
          {isPrivate ? <Lock className="size-3" /> : <Send className="size-3" />}
          {pending ? "Sending…" : verb}
        </Button>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={onCancel}
            className="h-7 px-3 text-xs"
          >
            Cancel
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The per-comment action row: reply, reply privately, and the moderation
 * controls live in the sibling `CommentModeration` component.
 *
 * Private reply is offered on both platforms but is genuinely different: on
 * Instagram it is a message addressed by comment id, on Facebook a dedicated
 * edge needing `read_page_mailboxes`. Neither is reversible and each is allowed
 * once per comment, so the label says "private" rather than "message" to avoid
 * implying a conversation continues here.
 */
export function CommentActions({
  workspace,
  commentNanoid,
  canReply,
  canPrivateReply,
  onQueued,
}: {
  workspace: string;
  commentNanoid: string;
  canReply: boolean;
  canPrivateReply: boolean;
  onQueued: () => void;
}) {
  const [open, setOpen] = useState<"reply" | "private" | null>(null);

  if (!canReply && !canPrivateReply) return null;

  return (
    <div className="mt-1 space-y-2">
      <div className="flex items-center gap-3">
        {canReply && (
          <button
            type="button"
            onClick={() => setOpen(open === "reply" ? null : "reply")}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
          >
            Reply
          </button>
        )}
        {canPrivateReply && (
          <button
            type="button"
            onClick={() => setOpen(open === "private" ? null : "private")}
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900"
          >
            <Lock className="size-3" />
            Reply privately
          </button>
        )}
      </div>

      {open === "reply" && (
        <CommentComposer
          mode="reply"
          workspace={workspace}
          commentNanoid={commentNanoid}
          onQueued={() => {
            setOpen(null);
            onQueued();
          }}
          onCancel={() => setOpen(null)}
        />
      )}

      {open === "private" && (
        <CommentComposer
          mode="private"
          workspace={workspace}
          commentNanoid={commentNanoid}
          onQueued={() => {
            setOpen(null);
            onQueued();
          }}
          onCancel={() => setOpen(null)}
        />
      )}
    </div>
  );
}
