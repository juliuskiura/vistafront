"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import type { ManagedChannel, Paginated, ScheduledPost } from "@/lib/api";
import { toQueryString } from "@/lib/api";
import { useApiFetch } from "@/lib/context";

import {
  channelChips,
  feedRequestStatus,
  filterFeedPosts,
  readFeedFilters,
} from "./lib/feed-filters";
import { feedKey, FEED_PAGE_SIZE } from "./lib/feed-query-keys";
import { FeedFilterBar } from "./_components/feed-filter-bar";
import { FeedList } from "./_components/feed-list";
import { FeedCard } from "./_components/feed-card";
import { FeedRail } from "./_components/feed-rail";
import { useFeedLive } from "./use-feed-live";

/** The Unified Feed's client half.
 *
 *  Owns exactly three things: the pages of posts it has loaded (one infinite
 *  query, keyed on the URL's filters), which card's thread is open, and the
 *  scroll-to-card behaviour for arriving from a post detail page. Channel and
 *  status filtering are the backend's; sorting and text matching are pure
 *  functions in `lib/`; everything else is a component below.
 */
export function FeedClient({
  workspace,
  pages,
}: {
  /** Workspace domain, for every API call and every link. */
  workspace: string;
  /** Connected channels, fetched by the Server Component. */
  pages: ManagedChannel[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiFetch = useApiFetch();

  // The URL is the source of truth: the server prefetched under the same
  // filters, so reading them back from here cannot disagree with first paint.
  const filters = useMemo(
    () => readFeedFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const sort = searchParams.get("sort") === "popular" ? "popular" : "recent";

  const [openPostNanoid, setOpenPostNanoid] = useState<string | null>(null);

  const {
    data,
    isError,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: feedKey(workspace, filters),
    queryFn: async ({ pageParam }) => {
      const response = await apiFetch(
        `/api/socialmanager/posts?${toQueryString({
          workspace,
          status: feedRequestStatus(filters),
          managed_page: filters.channel || undefined,
          page: pageParam,
          page_size: FEED_PAGE_SIZE,
        })}`,
      );
      // `apiFetch` only recovers from an expired session — every other failure
      // comes back as an ordinary response, so the body has to be checked
      // before it is trusted. An error payload read as a page of posts (Django
      // answers a page past the end with `{"detail": "Invalid page."}`) used to
      // flow through `flatMap` as `[undefined]` and break the card map.
      if (!response.ok) {
        throw new Error(`Feed request failed with ${response.status}`);
      }
      const page = (await response.json()) as Paginated<ScheduledPost>;
      if (!Array.isArray(page?.results)) {
        throw new Error("Feed response was not a page of posts");
      }
      return page;
    },
    initialPageParam: 1,
    // Django answers with a `next` URL while there is more to give; the next
    // page number is then simply "one past what we already hold".
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : undefined,
    // No refetchInterval: see `use-feed-live.ts`. The socket announces a new
    // comment and a window focus refetch covers everything else, without the
    // traffic a poll of a page of posts would cost.
    refetchOnWindowFocus: true,
  });

  // A comment landing anywhere in the feed refreshes the list, and the post
  // whose thread is open refreshes that thread too.
  useFeedLive(workspace, filters, openPostNanoid ?? undefined);

  const loaded = useMemo(
    () => data?.pages.flatMap((page) => page.results) ?? [],
    [data],
  );
  // Text match and sort are the two halves of the filter state the endpoint
  // cannot answer: Django has no `?search=`, and "most engagement" is an order
  // it does not produce.
  const shown = useMemo(
    () => filterFeedPosts(loaded, filters, sort),
    [loaded, filters, sort],
  );
  // Django's `count` is what the *server-side* filters match, so it is the
  // honest denominator for "showing N".
  const matched = data?.pages[0]?.count ?? loaded.length;

  /* ── Entry from a post's detail page ──
   * A DOM side effect, not data fetching: the card is already in the first page
   * or it is not, and scrolling is all that is owed to someone who clicked
   * "View Unified Feed". */
  const entryRef = useRef<string | null>(null);
  useEffect(() => {
    if (entryRef.current) return;
    const nanoid = filters.post;
    if (!nanoid) return;
    entryRef.current = nanoid;
    document
      .getElementById(`post-${nanoid}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [filters.post, loaded]);

  const onOpenThread = useCallback((nanoid: string) => {
    setOpenPostNanoid((current) => (current === nanoid ? null : nanoid));
  }, []);

  const pagesById = useMemo(() => {
    const byId: Record<string, ManagedChannel> = {};
    for (const page of pages) byId[page.nanoid] = page;
    return byId;
  }, [pages]);

  const chips = useMemo(() => channelChips(pages), [pages]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div className="min-w-0 space-y-4">
        <FeedFilterBar
          filters={filters}
          chips={chips}
          sort={sort}
          onSortChange={(next) => {
            const params = new URLSearchParams(searchParams.toString());
            if (next === "popular") params.set("sort", "popular");
            else params.delete("sort");
            const query = params.toString();
            router.replace(query ? `?${query}` : "?", { scroll: false });
          }}
        />

        {shown.length > 0 && (
          <p className="text-xs text-neutral-500">
            {filters.q
              ? // Text search has no endpoint behind it, so the denominator is
                // what is loaded rather than what the workspace holds.
                `Showing ${shown.length} of ${loaded.length} loaded post${loaded.length === 1 ? "" : "s"} matching “${filters.q}”`
              : `Showing ${shown.length} of ${matched} matching post${matched === 1 ? "" : "s"}`}
          </p>
        )}

        <FeedList
          posts={shown}
          isError={isError}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          onLoadMore={() => void fetchNextPage()}
          onRetry={() => void refetch()}
          workspaceSlug={workspace}
        >
          {shown.map((post) => (
            <FeedCard
              key={post.nanoid}
              post={post}
              pagesById={pagesById}
              workspace={workspace}
              workspaceSlug={workspace}
              isLabel={post.nanoid === filters.post}
              threadOpen={openPostNanoid === post.nanoid}
              onOpenThread={onOpenThread}
            />
          ))}
        </FeedList>
      </div>

      <FeedRail filters={filters} workspaceSlug={workspace} />
    </div>
  );
}
