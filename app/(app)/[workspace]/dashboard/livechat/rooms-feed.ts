"use client";

import { useEffect, useRef } from "react";

export interface RoomFeedRoom {
  nanoid: string;
  is_active: boolean;
  customer_name: string | null;
  agent_name: string | null;
  created_at: string | null;
}

type RoomFeedEvent = "room_opened" | "room_closed";

interface RoomFeedMessage {
  type: RoomFeedEvent;
  room: RoomFeedRoom;
}

/**
 * Admin live feed. Subscribes to the `ws/chat/rooms/` channel and passes each
 * `room_opened` / `room_closed` event payload to `onRoomChange`, so the admin
 * list can merge the event directly into local state — no HTTP refetch needed.
 * Reconnects automatically (3s) if the socket drops.
 */
export function useRoomsFeed(onRoomChange: (room: RoomFeedRoom) => void) {
  const callbacksRef = useRef(onRoomChange);
  useEffect(() => {
    callbacksRef.current = onRoomChange;
  }, [onRoomChange]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/chat/rooms/`;
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
            if (
              data.type === "room_opened" ||
              data.type === "room_closed"
            ) {
              callbacksRef.current(data.room);
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