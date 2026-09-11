"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ChatRoom } from "./types";

export function useChatRoom() {
  const { data: rooms, isPending } = useQuery<ChatRoom[]>({
    queryKey: ["chatRooms"],
    queryFn: () => fetch("/api/livechat/rooms").then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const currentRoom = useMemo(() => {
    if (!Array.isArray(rooms) || rooms.length === 0) return null;
    const open = rooms.filter((r) => r.is_active);
    if (open.length === 0) return null;
    return (
      [...open].sort((a, b) => {
        const at = new Date(a.updated_at ?? a.created_at).getTime();
        const bt = new Date(b.updated_at ?? b.created_at).getTime();
        return bt - at;
      })[0] ?? null
    );
  }, [rooms]);

  return { currentRoom, isPending };
}