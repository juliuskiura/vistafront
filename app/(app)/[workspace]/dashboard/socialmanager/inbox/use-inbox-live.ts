"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { inboxSummaryKey, inboxThreadKey } from "@/lib/api/inbox-keys";
import { useSocialSocket, type SocialFrame } from "@/hooks/use-social-socket";

/**
 * Whether the user is actually in front of the tab: the window is visible and
 * focused.
 *
 * This is the signal every real inbox uses to decide a message has been seen.
 * Messenger and WhatsApp Web issue no read receipt from a backgrounded tab,
 * and Slack marks a channel read only while its window is focused -- a thread
 * that is merely *open* in a tab the user switched away from is not being
 * read, and its unread badge must survive until the user comes back.
 */
function documentEngaged(): boolean {
  if (typeof document === "undefined") return false;
  return document.visibilityState === "visible" && document.hasFocus();
}

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
 * The one state-changing request in this flow -- the thread GET, whose
 * `retrieve` marks the conversation read server-side -- is gated on
 * `engaged`. A message that arrives while the tab is in the background
 * updates the list and the badge immediately, and the transcript waits: it
 * refreshes on the next user activity (a frame landing while the user is
 * looking, the poll landing while they are looking, or the user coming back to
 * the window), never before.
 *
 * @param workspace  Active workspace domain; part of every query key.
 * @param selectedId The thread currently open, if any.
 * @returns `connected` steers the list poll's pace; `engaged` is the list
 *   poll's own gate, which is what keeps a background tab's badge honest.
 */
export function useInboxLive(workspace: string, selectedId: string | null): {
  connected: boolean;
  engaged: boolean;
} {
  const queryClient = useQueryClient();
  const [engaged, setEngaged] = useState(documentEngaged);

  // Both signals, because each alone leaves a hole: `visibilitychange` covers
  // switching tabs or windows away, and `focus` covers a window regaining
  // focus while it was already visible.
  useEffect(() => {
    const sync = () => setEngaged(documentEngaged());
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const onSocialFrame = useCallback(
    (frame: SocialFrame) => {
      if (frame.type !== "message") return;
      // A prefix match covers the unsearched list and every searched variant,
      // so a frame that lands while the user is searching still refreshes
      // what they are looking at. The list and the summary are side-effect-
      // free reads, so they stay live in a background tab.
      void queryClient.invalidateQueries({
        queryKey: ["socialmanager-inbox", workspace],
      });
      void queryClient.invalidateQueries({
        queryKey: inboxSummaryKey(workspace),
      });
      // Only the open thread, and only while the user is actually looking at
      // it: this is the one request whose GET marks the thread read, so a
      // message that lands in a background tab must not fetch it. The user
      // coming back does.
      if (frame.conversation_nanoid === selectedId && engaged) {
        void queryClient.invalidateQueries({
          queryKey: inboxThreadKey(workspace, frame.conversation_nanoid),
        });
      }
    },
    [queryClient, workspace, selectedId, engaged],
  );

  const { connected } = useSocialSocket(workspace, onSocialFrame);

  // Catch-up on every (re)connect. Frames are fire-and-forget: one pushed while
  // the socket was down is gone, so the only safe assumption after a reconnect
  // is that everything could have changed. The list and the summary are
  // side-effect-free reads, so refreshing them costs nothing but a request;
  // the open thread follows only if the user is looking.
  useEffect(() => {
    if (!connected) return;
    void queryClient.invalidateQueries({
      queryKey: ["socialmanager-inbox", workspace],
    });
    void queryClient.invalidateQueries({
      queryKey: inboxSummaryKey(workspace),
    });
    if (selectedId && engaged) {
      void queryClient.invalidateQueries({
        queryKey: inboxThreadKey(workspace, selectedId),
      });
    }
  }, [connected, engaged, selectedId, queryClient, workspace]);

  // Coming back to the window is the slight user activity that settles a
  // waiting message: the list and the badge refetch because anything could
  // have changed while the user was away, and the open thread refetches
  // because the user is finally standing in front of it -- which is when its
  // GET marking it read stops being a lie.
  useEffect(() => {
    if (!engaged) return;
    void queryClient.invalidateQueries({
      queryKey: ["socialmanager-inbox", workspace],
    });
    void queryClient.invalidateQueries({
      queryKey: inboxSummaryKey(workspace),
    });
    if (selectedId) {
      void queryClient.invalidateQueries({
        queryKey: inboxThreadKey(workspace, selectedId),
      });
    }
  }, [engaged, selectedId, queryClient, workspace]);

  return { connected, engaged };
}
