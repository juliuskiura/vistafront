"use client";

import { useEffect, useRef } from "react";

/**
 * Admin live feed. Subscribes to the `ws/chat/rooms/` channel and fires
 * `onRoomChange` whenever a room is opened or closed anywhere, so the admin
 * console can refresh its room list the instant a customer starts a chat.
 * Reconnects automatically (3s) if the socket drops.
 */
export function useRoomsFeed(onRoomChange: () => void) {
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
            const data = JSON.parse(event.data);
            if (data.type === "room_opened" || data.type === "room_closed") {
              callbacksRef.current();
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