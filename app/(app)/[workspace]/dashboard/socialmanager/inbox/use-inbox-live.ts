"use client";

import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { inboxSummaryKey, inboxThreadKey } from "@/lib/api/inbox-keys";
import { useSocialSocket, type SocialFrame } from "@/hooks/use-social-socket";

/**
 * The inbox's live half: one socket, and what a frame does about it.
 *
 * A frame is a doorbell, not a delivery van -- it says "this thread changed"
 * and nothing more, so every invalidation below hands the work to the REST
 * endpoints the list, the badge, and the poll already read. The socket adds no
 * second version of the truth.
 *
 * It lives in its own hook rather than inside InboxClient for two reasons: the
 * client was within reach of the repo's 300-line ceiling once this logic moved
 * in, and the catch-up rule deserves one readable home.
 *
 * @param workspace  Active workspace domain; part of every query key.
 * @param selectedId The thread currently open, if any.
 * @returns Whether the socket is up -- the list's poll uses it to pick its
 *   pace, and the caller uses the reconnect transition to catch up.
 */
export function useInboxLive(workspace: string, selectedId: string | null) {
  const queryClient = useQueryClient();

  const onSocialFrame = useCallback(
    (frame: SocialFrame) => {
      if (frame.type !== "message") return;
      // A prefix match covers the unsearched list and every searched variant,
      // so a frame that lands while the user is searching still refreshes
      // what they are looking at.
      void queryClient.invalidateQueries({
        queryKey: ["socialmanager-inbox", workspace],
      });
      void queryClient.invalidateQueries({
        queryKey: inboxSummaryKey(workspace),
      });
      // Only the open thread. Reading a thread clears its unread badge
      // server-side (`retrieve` marks it read), so refetching any other
      // transcript would silently mark threads read for a user who is looking
      // at a different one -- the exact bug the transcript's no-polling rule
      // was written to avoid.
      if (frame.conversation_nanoid === selectedId) {
        void queryClient.invalidateQueries({
          queryKey: inboxThreadKey(workspace, frame.conversation_nanoid),
        });
      }
    },
    [queryClient, workspace, selectedId],
  );

  const { connected } = useSocialSocket(workspace, onSocialFrame);

  // Catch-up on every (re)connect. Frames are fire-and-forget: one pushed while
  // the socket was down is gone, so the only safe assumption after a reconnect
  // is that everything could have changed. The list and the summary are
  // side-effect-free reads, so refreshing them costs nothing but a request.
  useEffect(() => {
    if (!connected) return;
    void queryClient.invalidateQueries({
      queryKey: ["socialmanager-inbox", workspace],
    });
    void queryClient.invalidateQueries({
      queryKey: inboxSummaryKey(workspace),
    });
  }, [connected, queryClient, workspace]);

  return connected;
}
