"use client";

import { useQuery } from "@tanstack/react-query";

import type { SocialInboxSummary } from "@/lib/api/inbox";
import { inboxSummaryKey } from "@/lib/api/inbox-keys";
import { useApiFetch } from "@/lib/context";

/** How often the badge refreshes while the inbox is not the polling view. */
const POLL_INTERVAL_MS = 30_000;

/**
 * The workspace's unread inbox total, for the section nav badge.
 *
 * Polls the summary Route Handler on the same 30-second cadence as the thread
 * list, so the count is fresh on every Social Manager tab. The Server Component
 * layout prefetches the same query key, so the first paint carries the real
 * count instead of a zero that flips once the poll returns.
 *
 * `poll: false` is for the inbox itself: its thread-list query already polls and
 * invalidates this key from its results (see `InboxClient`), so running a second
 * timer against the same backend would be a redundant request per interval.
 * A window-focus refetch still fires either way, so a long-idle tab is not left
 * with a stale count after the user returns to it.
 */
export function useInboxUnread(
  workspace: string,
  { poll = true }: { poll?: boolean } = {},
): number {
  const apiFetch = useApiFetch();
  const { data } = useQuery<SocialInboxSummary>({
    queryKey: inboxSummaryKey(workspace),
    queryFn: () => fetchSummary(workspace, apiFetch),
    refetchInterval: poll ? POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
  });

  return Math.max(0, data?.unread_total ?? 0);
}

/**
 * Read the count through the Route Handler rather than `serverFetch`, which is
 * server-only. `apiFetch` is threaded in instead of called as a hook because
 * `queryFn` is not a component; it carries the session-recovery callback so a
 * poll that meets an expired token triggers a refresh instead of failing.
 */
async function fetchSummary(
  workspace: string,
  apiFetch: ReturnType<typeof useApiFetch>,
): Promise<SocialInboxSummary> {
  const res = await apiFetch(
    `/api/socialmanager/inbox/summary?workspace=${encodeURIComponent(workspace)}`,
  );
  if (!res.ok) {
    throw new Error(`Inbox summary request failed: ${res.status}`);
  }
  return (await res.json()) as SocialInboxSummary;
}
