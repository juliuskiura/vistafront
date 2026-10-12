"use client";

import Link from "next/link";

import type { ScheduledPost } from "@/lib/api/types";
import { AlertCircle, Loader2 } from "@/lib/icons";

import { FeedSkeleton } from "./feed-skeleton";

/**
 * The feed's list, and the three states that are not a list.
 *
 * "We could not load the feed" and "there is nothing in it yet" are different
 * statements: the first offers a retry, the second offers the composer. Rendering
 * both as "No posts" is how a broken fetch comes to look like an empty
 * workspace.
 *
 * The list is a real `<ul>`/`<li>` with `<Link>` targets — never a `div` with an
 * `onClick`, so the keyboard and a screen reader reach every post.
 */
export function FeedList({
  posts,
  isError,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onRetry,
  workspaceSlug,
  children,
}: {
  posts: ScheduledPost[];
  isError: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  workspaceSlug: string;
  children: React.ReactNode;
}) {
  if (isLoading && posts.length === 0) {
    return <FeedSkeleton />;
  }

  if (isError && posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
        <AlertCircle aria-hidden className="mx-auto size-8 text-red-500" />
        <h3 className="mt-3 text-base font-semibold text-neutral-900">
          The feed could not be loaded
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
          This is a problem reading VistaSolve, not with your channels. The posts
          are still where they were.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex h-9 items-center rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 shadow-xs hover:bg-neutral-50"
        >
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
        <h3 className="text-base font-semibold text-neutral-900">
          Nothing published here yet
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
          The feed fills up as posts reach your channels. Compose one, or connect
          a channel, and it will show up here.
        </p>
        <Link
          href={`/${workspaceSlug}/dashboard/socialmanager/compose`}
          className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary-600 px-4 text-sm font-medium text-white shadow-xs hover:bg-primary-500"
        >
          Open the composer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">{children}</ul>
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 shadow-xs hover:bg-neutral-50 disabled:opacity-60"
          >
            {isFetchingNextPage && (
              <Loader2 aria-hidden className="size-3.5 animate-spin" />
            )}
            {isFetchingNextPage ? "Loading…" : "Load more posts"}
          </button>
        </div>
      )}
      {!hasNextPage && posts.length > 0 && (
        <p className="pt-2 text-center text-xs text-neutral-400">
          {posts.length} post{posts.length === 1 ? "" : "s"} loaded — that is
          everything this filter matches.
        </p>
      )}
    </div>
  );
}
