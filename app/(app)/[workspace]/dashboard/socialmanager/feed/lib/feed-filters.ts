import type { ManagedChannel, ScheduledPost } from "@/lib/api/types";

/**
 * The Unified Feed's filter state, read from and written to the URL.
 *
 * `channel` is a **channel nanoid**, not a platform slug. Django's post filter
 * is `?managed_page=` — one channel — so brand-level "show me Instagram" cannot
 * be expressed in one request. Using the channel keeps the filter honest: a
 * post that reached Facebook *and* Instagram is a match for either channel, and
 * paging a brand-level filter client-side would silently hide older posts.
 */
export interface FeedFilters {
  /** Channel nanoid, or "" for every channel. */
  channel: string;
  /** Post status; "" means the feed's own default (published). */
  status: string;
  /** Free text, matched against the loaded posts only. */
  q: string;
  /** Nanoid of the post the user arrived from, if any. */
  post: string;
}

export const FEED_STATUSES = [
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "draft", label: "Drafts" },
  { value: "failed", label: "Failed" },
] as const;

/**
 * The status the feed asks for.
 *
 * The timeline opens on what actually reached the platforms — drafts and
 * scheduled posts are Compose's and Calendar's job — but the URL can ask for
 * another. The BFF route passes this straight through, so this is the single
 * place the default lives: server prefetch and client refetch cannot disagree.
 */
export function feedRequestStatus(filters: FeedFilters): string {
  return filters.status || "published";
}

/** A channel pill: one entry per connected channel, because that is the unit
 *  Django can filter by. */
export interface FeedChannelChip {
  value: string;
  label: string;
  /** The channel's platform (connect door) slug, for the glyph. */
  platform: string;
}

/**
 * Read the filter tuple off a URL's query string.
 *
 * Array values (a repeated `?channel=`) collapse to their first entry rather
 * than throwing: a hand-edited URL should degrade to a working feed, not to a
 * crash page.
 */
export function readFeedFilters(params: URLSearchParams): FeedFilters {
  const one = (key: string) => {
    const raw = params.get(key);
    return raw === null ? "" : raw.trim();
  };
  return {
    channel: one("channel"),
    status: one("status"),
    q: one("q"),
    post: one("post"),
  };
}

/**
 * Whether any filter is active — drives the "Clear all" affordance, which is
 * noise when there is nothing to clear.
 */
export function hasActiveFilters(filters: FeedFilters): boolean {
  return Boolean(filters.channel || filters.status || filters.q);
}

/**
 * The channel pill list, in first-seen order.
 *
 * Inactive channels are dropped: a channel whose token died cannot have
 * published anything, and a pill that always returns an empty feed teaches the
 * user the console is broken.
 */
export function channelChips(pages: ManagedChannel[]): FeedChannelChip[] {
  const chips: FeedChannelChip[] = [];
  const seen = new Set<string>();
  for (const page of pages) {
    if (!page.is_active || seen.has(page.nanoid)) continue;
    seen.add(page.nanoid);
    chips.push({
      value: page.nanoid,
      label: page.platform_name || page.page_name || page.username || "Channel",
      platform: page.platform || "",
    });
  }
  return chips;
}

/** Label for the status pill list, since the raw key is not user-facing. */
export function statusLabel(status: string): string {
  return (
    FEED_STATUSES.find((option) => option.value === status)?.label ?? status
  );
}

/**
 * Sort the loaded posts.
 *
 * Django already returns most-recent-first
 * (`ScheduledPost.Meta.ordering`), so "recent" is the identity. "popular" is
 * the one order the backend cannot express, and it is computed over the loaded
 * page only — a fact the UI has to state, since the number changes as pages
 * arrive.
 */
export function sortFeedPosts(
  posts: ScheduledPost[],
  sort: "recent" | "popular",
): ScheduledPost[] {
  if (sort !== "popular") return posts;
  return [...posts].sort(
    (a, b) =>
      b.reactions_count + b.comment_count - (a.reactions_count + a.comment_count),
  );
}

/**
 * Match the free-text term against a post.
 *
 * Searches the caption and every channel's own copy, because a tailored
 * Instagram caption carries words the master copy never had. Hashtags match
 * with or without their `#`, which is how people type them.
 */
export function matchesQuery(post: ScheduledPost, term: string): boolean {
  if (!term) return true;
  const needle = term.toLowerCase();
  const bodies = [
    post.content,
    ...post.recipients.map((r) => r.content ?? ""),
  ];
  return bodies.some((body) => {
    const haystack = body.toLowerCase();
    return (
      haystack.includes(needle) ||
      haystack
        .split(/\s+/)
        .some((word) => word.replace(/^#/, "").startsWith(needle.replace(/^#/, "")))
    );
  });
}

/** Apply the client-side halves of the filter state (text + sort). */
export function filterFeedPosts(
  posts: ScheduledPost[],
  filters: FeedFilters,
  sort: "recent" | "popular",
): ScheduledPost[] {
  const q = filters.q.trim();
  return sortFeedPosts(
    q ? posts.filter((post) => matchesQuery(post, q)) : posts,
    sort,
  );
}
