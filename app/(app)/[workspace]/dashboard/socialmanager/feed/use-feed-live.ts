"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { feedCommentsKey, feedListKeyPrefix } from "./lib/feed-query-keys";
import type { FeedFilters } from "./lib/feed-filters";
import { useSocialSocket, type SocialFrame } from "@/hooks/use-social-socket";

/**
 * The feed's live half: what a "comment happened" frame does about it.
 *
 * A frame is a doorbell, not a delivery van — it names the post and carries no
 * comment, so the answer is always an invalidation that hands the work to the
 * REST endpoints the feed already reads. The socket never becomes a second
 * source of truth, which is the same rule the inbox's `use-inbox-live.ts`
 * follows.
 *
 * The list invalidates for any post, because a comment changes the count shown
 * on that post's card wherever it sits in the feed. There is no polling
 * backstop here on purpose: a feed of posts is not the inbox, and a 45-second
 * poll of a page of posts buys the user nothing the socket and a window-focus
 * refetch do not already cover.
 *
 * `undefined` while the thread is closed, so a card with no open thread costs
 * nothing but the list query it already holds.
 */
export function useFeedLive(
  workspace: string,
  filters: FeedFilters,
  openPostNanoid?: string,
) {
  const queryClient = useQueryClient();

  const onFrame = (frame: SocialFrame) => {
    if (frame.type !== "comment") return;
    // Prefix match, so a frame for a post the user is looking at refreshes the
    // list under whichever filter combination produced it.
    void queryClient.invalidateQueries({
      queryKey: feedListKeyPrefix(workspace),
    });
    if (frame.post_nanoid === openPostNanoid) {
      // The open card's thread subscribes for itself as well — see
      // `PostCommentsBody` — so this is belt and braces, and matters only when
      // the card's own effect has not mounted yet.
      void queryClient.invalidateQueries({
        queryKey: feedCommentsKey(workspace, frame.post_nanoid),
      });
    }
  };

  // Catch-up on (re)connect: frames pushed while the socket was down are gone
  // for good, so the only safe assumption is that anything could have changed.
  const { connected } = useSocialSocket(workspace, onFrame);
  useEffect(() => {
    if (!connected) return;
    void queryClient.invalidateQueries({
      queryKey: feedListKeyPrefix(workspace),
    });
  }, [connected, queryClient, workspace]);

  return { connected };
}
