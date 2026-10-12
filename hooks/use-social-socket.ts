"use client";

import { useEffect, useRef, useState } from "react";

import { getWebSocketUrl } from "@/lib/env";

/**
 * One frame from the workspace's social feed.
 *
 * The server's nudge names the thing that changed and carries nothing else —
 * not the message text, not the comment body. The caller answers by refetching
 * the endpoints it already owns, so the socket can never become a second,
 * diverging source of truth.
 */
export type SocialFrame =
  | { type: "message"; conversation_nanoid: string }
  | { type: "comment"; post_nanoid: string };

interface SocialSocketMessage {
  type: "connected" | SocialFrame["type"];
  conversation_nanoid?: string;
  post_nanoid?: string;
}

/**
 * How long to wait before redialing a dropped socket.
 *
 * The livechat feed reconnects on this same 3-second beat; a feed whose frames
 * are "go refetch" does not need a fancier curve, because the data it wakes up
 * is authoritative the moment the socket returns.
 */
const RECONNECT_MS = 3_000;

/**
 * Receive-only socket to a workspace's social feed: Unified Inbox messages and
 * post-comment changes (`ws/social/<domain>/`, served by Django's Channels
 * stack behind nginx's `/ws/` block).
 *
 * Authentication needs nothing from this file: the connection is same-origin,
 * so the browser attaches the httpOnly session cookie and `CookieJWTAuthMiddleware`
 * resolves the user server-side. No token ever reaches JavaScript.
 *
 * Two things the caller should know:
 *
 * - `connected` is how the UI decides whether the slow backstop poll is still
 *   needed. `false` means "the 30-second pace stays"; `true` means the socket
 *   is dry and the poll can slow down.
 * - Frames pushed while the socket was down are gone for good, so a
 *   `false → true` transition is the caller's cue to refetch everything once —
 *   that is the catch-up path, and it is why a reconnect closes no gap.
 */
export function useSocialSocket(
  workspace: string,
  onFrame: (frame: SocialFrame) => void,
) {
  const [connected, setConnected] = useState(false);
  // The frame callback usually closes over the selected thread or the current
  // post, both of which change on every render. Holding it in a ref keeps the
  // socket from being torn down and redialed because a closure was re-created.
  const frameCallbackRef = useRef(onFrame);
  useEffect(() => {
    frameCallbackRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    const target = getWebSocketUrl(
      `/ws/social/${encodeURIComponent(workspace)}/`,
    );
    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;
      try {
        socket = new WebSocket(target);
        socket.onopen = () => {
          if (!cancelled) setConnected(true);
        };
        socket.onmessage = (event) => {
          if (cancelled) return;
          try {
            const data = JSON.parse(event.data) as SocialSocketMessage;
            if (data.type === "message" && data.conversation_nanoid) {
              frameCallbackRef.current({
                type: "message",
                conversation_nanoid: data.conversation_nanoid,
              });
            } else if (data.type === "comment" && data.post_nanoid) {
              frameCallbackRef.current({
                type: "comment",
                post_nanoid: data.post_nanoid,
              });
            }
            // The hello frame ({"type": "connected"}) needs no handling: it
            // only reassures a human reading the network tab that the server
            // accepted the workspace.
          } catch {
            /* ignore malformed frames */
          }
        };
        socket.onclose = () => {
          if (cancelled) return;
          setConnected(false);
          socket = null;
          reconnectTimer = setTimeout(connect, RECONNECT_MS);
        };
        socket.onerror = () => {
          socket?.close();
        };
      } catch {
        reconnectTimer = setTimeout(connect, RECONNECT_MS);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
      socket = null;
    };
  }, [workspace]);

  return { connected };
}
