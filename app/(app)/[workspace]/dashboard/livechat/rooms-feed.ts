"use client";

import { useEffect, useRef } from "react";
import { getWebSocketUrl } from "@/lib/env";
import type { RoomFeedRoom } from "./room-mappers";

export type { RoomFeedRoom, RoomLastMessage } from "./room-mappers";
export { mapChatRoomToFeed, mapChatRoomsToFeed } from "./room-mappers";

type RoomFeedEvent = "room_opened" | "room_closed";

interface RoomFeedMessage {
  type: RoomFeedEvent | "room_message" | "room_read";
  room?: RoomFeedRoom;
  room_nanoid?: string;
  unread_count?: number;
}

/**
 * Admin live feed. Subscribes to the `ws/chat/rooms/` channel and passes each
 * `room_opened` / `room_closed` event payload to `onRoomChange`, so the admin
 * list can merge the event directly into local state — no HTTP refetch needed.
 * Reconnects automatically (3s) if the socket drops.
 */
export function useRoomsFeed(
  onRoomChange: (room: RoomFeedRoom) => void,
  onUnreadChange?: (roomNanoid: string, unreadCount: number) => void,
) {
  const callbacksRef = useRef(onRoomChange);
  const unreadCallbackRef = useRef(onUnreadChange);
  useEffect(() => {
    callbacksRef.current = onRoomChange;
  }, [onRoomChange]);
  useEffect(() => {
    unreadCallbackRef.current = onUnreadChange;
  }, [onUnreadChange]);

  useEffect(() => {
    const wsUrl = getWebSocketUrl("/ws/chat/rooms/");
    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;
      try {
        socket = new WebSocket(wsUrl);
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as RoomFeedMessage;
            if (data.type === "room_opened" || data.type === "room_closed") {
              if (data.room) callbacksRef.current(data.room);
            } else if (
              (data.type === "room_message" || data.type === "room_read") &&
              data.room_nanoid &&
              typeof data.unread_count === "number"
            ) {
              unreadCallbackRef.current?.(data.room_nanoid, data.unread_count);
            }
          } catch {
            /* ignore malformed frames */
          }
        };
        socket.onclose = () => {
          if (cancelled) return;
          socket = null;
          reconnectTimer = setTimeout(connect, 3000);
        };
        socket.onerror = () => {
          socket?.close();
        };
      } catch {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
      socket = null;
    };
  }, []);
}
