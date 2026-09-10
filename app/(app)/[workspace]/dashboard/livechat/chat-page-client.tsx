"use client";

import { useQuery } from "@tanstack/react-query";
import { ChatSheet } from "@/components/workspace/chat-sheet";
import type { ChatRoom } from "@/lib/api";

interface Props {
  rooms: ChatRoom[];
  workspaceDomain: string;
}

export function ChatPageClient({ rooms, workspaceDomain }: Props) {
  const { data: liveRooms } = useQuery<ChatRoom[]>({
    queryKey: ["chatRooms", workspaceDomain],
    queryFn: () =>
      fetch(`/api/livechat/rooms?workspace=${workspaceDomain}`).then((r) =>
        r.json(),
      ),
    refetchInterval: 30000,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Chat</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Click the chat icon in the top nav to start messaging.
      </p>
      <ChatSheet workspaceDomain={workspaceDomain} />
    </div>
  );
}
