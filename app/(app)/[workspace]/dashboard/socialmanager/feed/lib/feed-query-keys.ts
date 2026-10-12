import type { FeedFilters } from "./feed-filters";

/** Posts per feed page. Matches Django's own default page size. */
export const FEED_PAGE_SIZE = 25;

/**
 * The one place the feed's query keys are built.
 *
 * The workspace is part of every key so one workspace's posts can never appear
 * under another's in the cache — the same rule as `lib/api/inbox-keys.ts`,
 * kept local because only the feed reads these.
 *
 * `filters` is passed as a whole rather than field by field so a new filter
 * cannot be added to one call site and forgotten in the other: whatever server
 * prefetch and client query receive, they receive the same string.
 */
export function feedKey(workspace: string, filters: FeedFilters) {
  return [
    "socialmanager-feed",
    workspace,
    filters.channel,
    filters.status,
    filters.q,
  ] as const;
}

/**
 * The prefix every filter combination of the list shares, for invalidations.
 *
 * Must stay a strict prefix of {@link feedKey}: it matches every
 * channel/status/search variant, which is what an invalidation wants when a
 * comment lands on a post the user is looking at.
 */
export function feedListKeyPrefix(workspace: string) {
  return ["socialmanager-feed", workspace] as const;
}

/**
 * Key for one post's comment thread.
 *
 * Separate from the feed key, and fetched only while that card's thread is
 * open: there is no endpoint that counts comments for a page of posts, so
 * prefetching one request per card is the one thing that would make the feed
 * slow on a workspace with real volume.
 */
export function feedCommentsKey(workspace: string, postNanoid: string) {
  return ["socialmanager-feed-comments", workspace, postNanoid] as const;
}
