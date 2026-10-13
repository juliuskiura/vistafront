import { useState } from "react";
import {
  Edit3,
  ExternalLink,
  MoreVertical,
  Pause,
  RefreshCw,
  Send,
  Trash2,
  Share2,
  Copy,
  Loader2,
} from "@/lib/icons";
import type { ScheduledPost } from "@/lib/api/types";

/** One line saying what a retry actually did, read off the post *after* it. */
export function retryOutcome(post: ScheduledPost): string {
  const failed = post.recipients.filter((r) => r.status === "failed");
  const published = post.recipients.filter((r) => r.status === "published");
  if (!failed.length) {
    return published.length > 1
      ? `Retry finished — all ${published.length} channels are published.`
      : "Retry finished — the channel is published.";
  }
  return `Retry finished — ${failed.length} of ${post.recipients.length} channels still failed. See the details below.`;
}

/** Overflow menu offering every per-post action: edit, duplicate, view on
 *  platform, share, pause/cancel, retry, publish, delete. */
export function PostActionsMenu({
  post,
  onAction,
  hasFailedRecipients,
}: {
  post: ScheduledPost;
  onAction: (action: string) => void;
  hasFailedRecipients: boolean;
}) {
  const [open, setOpen] = useState(false);

  const actions = [
    { label: "Edit", icon: Edit3, action: "edit" },
    { label: "Duplicate", icon: Copy, action: "duplicate" },
    { label: "View on platform", icon: ExternalLink, action: "view" },
    { label: "Share", icon: Share2, action: "share" },
    post.status === "scheduled" ? { label: "Pause", icon: Pause, action: "cancel" } : null,
    hasFailedRecipients
      ? { label: "Retry failed channels", icon: RefreshCw, action: "retry" }
      : null,
    post.status === "failed" || post.status === "draft"
      ? { label: "Publish now", icon: Send, action: "publish" }
      : null,
    { label: "Delete", icon: Trash2, action: "delete", danger: true },
  ].filter(Boolean) as { label: string; icon: typeof Edit3; action: string; danger?: boolean }[];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
      >
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
            {actions.map((item) => (
              <button
                key={item.action}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onAction(item.action);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                  item.danger ? "text-red-600 hover:text-red-700" : "text-neutral-700"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
