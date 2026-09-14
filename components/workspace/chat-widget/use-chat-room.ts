"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ChatRoom } from "./types";

export function useChatRoom() {
  const { data: room, isPending } = useQuery<ChatRoom | null>({
    queryKey: ["chatRooms"],
    queryFn: () => fetch("/api/livechat/rooms/active-room/").then((r) => r.json()),
  });

  const currentRoom = useMemo(() => {
    return room ?? null;
  }, [room]);

  return { currentRoom, isPending };
}