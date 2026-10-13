import { Suspense } from "react";

import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { listPages, listPostsPage } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import type { ManagedChannel } from "@/lib/api/types";

import { feedRequestStatus, readFeedFilters } from "./lib/feed-filters";
import { feedKey, FEED_PAGE_SIZE } from "./lib/feed-query-keys";
import { FeedClient } from "./feed-client";
import { FeedSkeleton } from "./_components/feed-skeleton";

/**
 * Unified Feed (Server Component).
 *
 * Every published post across every connected channel, newest first — the
 * timeline the section was missing: Compose plans, Calendar schedules, the
 * Inbox answers messages, and this is what the audience is looking at.
 *
 * Only page 1 is prefetched. `LiveServerData` wraps `prefetchQuery`, which
 * cannot carry a `useInfiniteQuery` cache, so the client is built inline here;
 * the boundary it renders is the same one the helper would have used, and the
 * key is built by the same module the client uses, so the dehydrated cache is
 * picked up on first paint rather than thrown away.
 *
 * The channel list is fetched here rather than client-side because the filter
 * pills are rendered on the server too: a workspace with no channels must show
 * "connect one", which is a server fact, not a loading state.
 */
export default async function UnifiedFeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{
    channel?: string;
    status?: string;
    q?: string;
    post?: string;
  }>;
}) {
  const { workspace: slug } = await params;
  const query = await searchParams;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "socialmanager.posts");
  const ws = active.domain;

  // One reader for both sides of the boundary: the filters this page prefetches
  // under must be the filters the client thinks it is looking at.
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) sp.set(key, value);
  }
  const filters = readFeedFilters(sp);

  const qc = new QueryClient();
  // `prefetchInfiniteQuery` is a client method here rather than the top-level
  // export the docs show: this version of TanStack Query only ships it on the
  // QueryClient, which is why `LiveServerData` (a `prefetchQuery` helper) cannot
  // carry an infinite cache and the client is built inline instead.
  await qc.prefetchInfiniteQuery({
    queryKey: feedKey(ws, filters),
    queryFn: () =>
      listPostsPage({
        workspace: ws,
        status: feedRequestStatus(filters),
        managed_page: filters.channel || undefined,
        page: 1,
        pageSize: FEED_PAGE_SIZE,
      }),
    initialPageParam: 1,
  });

  // A workspace whose channels cannot be listed still gets its feed: the posts
  // are what matter, and the pills are additive.
  const pages = await listPages({ workspace: ws }).catch(() => [] as ManagedChannel[]);

  return (
    <div className="flex min-h-full flex-col">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          Unified Feed
        </h1>
        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">
          Every post you have published, across every connected channel, with the
          audience conversation attached.
        </p>
      </header>

      <div className="mt-6 flex-1">
        {/* The island reads `useSearchParams` to keep filters linkable, which
            opts this boundary into client rendering, so it needs a real
            fallback rather than null. */}
        <Suspense fallback={<FeedSkeleton />}>
          <HydrationBoundary state={dehydrate(qc)}>
            <FeedClient
              workspace={ws}
              pages={pages}
            />
          </HydrationBoundary>
        </Suspense>
      </div>
    </div>
  );
}
