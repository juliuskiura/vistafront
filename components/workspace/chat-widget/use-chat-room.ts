"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApiFetch } from "@/lib/context";
import type { ChatRoom } from "./types";

export function useChatRoom() {
  const apiFetch = useApiFetch();
  const { data: room, isPending } = useQuery<ChatRoom | null>({
    queryKey: ["chatRooms"],
    queryFn: () =>
      apiFetch("/api/livechat/rooms/active-room/").then((r) => r.json()),
  });

  const currentRoom = useMemo(() => {
    return room ?? null;
  }, [room]);

  return { currentRoom, isPending };
}