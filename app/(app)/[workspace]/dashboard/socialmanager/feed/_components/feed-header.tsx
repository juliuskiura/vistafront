"use client";

import type { ScheduledPost } from "@/lib/api/types";
import { formatMediumDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { PlatformGlyph } from "@/components/platform-icon";
import { STATUS_STYLES } from "@/components/socialmanager/platform-gradients";

/** Shared header rendered above the post media in both the feed card and
 *  the post detail page, so the single-parent-post visual language is
 *  identical everywhere. */
export function FeedHeader({
  post,
  brands,
  status,
}: {
  post: ScheduledPost;
  brands: string[];
  status: string;
}) {
  const getStatusStyle = (s: string) => STATUS_STYLES[s] ?? STATUS_STYLES.draft;

  return (
    <div className="relative flex items-start gap-3 pb-3 border-b border-neutral-200">
      {/* Vistasolve logo + identity strip */}
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-black/5">
        <img src="/icon.svg" alt="Vistasolve" className="size-7 object-contain" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-neutral-900">
            Vistasolve
          </p>
          {post.recipients.length > 1 && (
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
              {post.recipients.length} channels shared
            </span>
          )}
        </div>
        <p className="flex flex-wrap items-center gap-1 text-xs text-neutral-500">
          {post.published_at ? (
            <>
              <span>Published</span>
              <span aria-hidden>·</span>
              <time dateTime={post.published_at}>
                {formatMediumDateTime(post.published_at)}
              </time>
            </>
          ) : post.scheduled_at ? (
            <>
              <span>Scheduled</span>
              <span aria-hidden>·</span>
              <time dateTime={post.scheduled_at}>
                {formatMediumDateTime(post.scheduled_at)}
              </time>
            </>
          ) : (
            <span>Not scheduled</span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
            getStatusStyle(status),
          )}
        >
          {status}
        </span>
        {brands.length > 0 && (
          <div className="flex items-center gap-1">
            {brands.map((brand) => (
              <span
                key={brand}
                title={`Shared on ${brand}`}
                className="flex size-6 items-center justify-center rounded-full bg-neutral-100 ring-1 ring-black/5"
              >
                <PlatformGlyph platform={brand} size="lg" solid />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
