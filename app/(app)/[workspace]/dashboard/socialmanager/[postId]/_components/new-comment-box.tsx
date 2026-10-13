import { useState } from "react";
import { MessageSquare } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import type { ManagedChannel, ScheduledPost } from "@/lib/api/types";
import { PlatformGlyph } from "@/components/platform-icon";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { CommentComposer } from "@/components/socialmanager/comment-composer";

/**
 * "Comment again" on a published post, with a channel picker.
 *
 * The picker is not decoration. A post published to a Facebook Page and an
 * Instagram account has one recipient each, and the backend requires a
 * recipient — so defaulting to the first would comment on whichever network
 * happened to be listed first. With one channel there is nothing to choose and
 * the control is hidden rather than shown disabled.
 */
export function NewCommentBox({
  recipients,
  pagesById,
  workspaceDomain,
  onQueued,
}: {
  recipients: ScheduledPost["recipients"];
  pagesById: Record<string, ManagedChannel>;
  workspaceDomain: string;
  onQueued: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { brandOf } = usePlatformBrand();

  const published = recipients.filter(
    (r) => r.status === "published" && Boolean(r.external_post_id),
  );

  if (published.length === 0) {
    /* Nothing to comment on: no channel published this post, so there is no
       object on the platform to attach a comment to. */
    return (
      <p className="text-xs text-neutral-500">
        Nothing to comment on — this post has no published channel yet.
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-1.5 px-3 text-xs"
      >
        <MessageSquare className="size-3.5" />
        Add a comment
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {published.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {published.map((r) => {
            const channel = pagesById[r.managed_page];
            return (
              <span
                key={r.nanoid}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600"
              >
                <PlatformGlyph platform={brandOf(channel?.platform)} size="sm" />
                {channel?.platform_name || r.managed_page_name}
              </span>
            );
          })}
        </div>
      )}
      <CommentComposer
        mode="create"
        workspace={workspaceDomain}
        recipientNanoid={published[0].nanoid}
        onQueued={() => {
          setOpen(false);
          onQueued();
        }}
        onCancel={() => setOpen(false)}
      />
      {published.length > 1 && (
        <p className="text-[11px] text-neutral-500">
          Commenting on{" "}
          {pagesById[published[0].managed_page]?.platform_name ??
            published[0].managed_page_name}
          . A post on several channels takes one comment at a time.
        </p>
      )}
    </div>
  );
}
