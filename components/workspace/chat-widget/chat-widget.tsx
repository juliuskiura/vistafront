"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatRoom } from "./use-chat-room";
import { useChatSocket } from "./use-chat-socket";
import { useToast } from "@/lib/context";
import { ChatLauncher } from "./_components/chat-launcher";
import { ChatPanel } from "./_components/chat-panel";
import type { ChatMessage, ChatRoom } from "./types";

interface ChatWidgetProps {
  userName?: string | null;
}

export function ChatWidget({ userName = null }: ChatWidgetProps) {
  const [minimized, setMinimized] = useState(true);
  const minimizedRef = useRef(true);

  useEffect(() => {
    minimizedRef.current = minimized;
  }, [minimized]);

  const { currentRoom, isPending } = useChatRoom();
  const queryClient = useQueryClient();
  const { push: toast } = useToast();

  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);

  const handleStart = async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setStarting(true);
    try {
      const res = await fetch("/api/livechat/rooms", { method: "POST" });
      if (!res.ok) throw new Error("create failed");
      const newRoom = (await res.json()) as ChatRoom;
      await queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
    } catch {
      toast({ variant: "error", message: "Failed to open a chat" });
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  };

  const room = isPending ? null : currentRoom;

  return (
    <ChatWidgetInner
      key={room?.nanoid ?? "no-room"}
      room={room}
      minimized={minimized}
      minimizedRef={minimizedRef}
      userName={userName}
      starting={starting}
      onStart={handleStart}
      onMinimize={() => setMinimized(true)}
      onOpen={() => setMinimized(false)}
    />
  );
}

interface ChatWidgetInnerProps {
  room: ChatRoom | null;
  minimized: boolean;
  minimizedRef: React.MutableRefObject<boolean>;
  userName?: string | null;
  starting: boolean;
  onStart: () => void;
  onMinimize: () => void;
  onOpen: () => void;
}

function ChatWidgetInner({
  room,
  minimized,
  minimizedRef,
  userName,
  starting,
  onStart,
  onMinimize,
  onOpen,
}: ChatWidgetInnerProps) {
  const [unread, setUnread] = useState(0);
  const tempIdRef = useRef(0);

  const { data: history } = useQuery<ChatMessage[]>({
    queryKey: ["chatMessages", room?.nanoid],
    queryFn: () =>
      fetch(`/api/livechat/messages?room=${room?.nanoid}`).then((r) => r.json()),
    enabled: !!room?.nanoid,
    refetchInterval: 15_000,
  });

  const { messages, replaceHistory, wsReady, sendMessage } = useChatSocket({
    roomNanoid: room?.nanoid,
    minimizedRef,
    userName,
    onUnread: () => setUnread((u) => u + 1),
  });

  useEffect(() => {
    if (history && room?.nanoid) replaceHistory(history);
  }, [history, room?.nanoid, replaceHistory]);

  const openPanel = () => {
    onOpen();
    setUnread(0);
  };

  const handleSend = (content: string, sentAt: Date) => {
    const trimmed = content.trim();
    if (!trimmed || !room?.nanoid) return;

    const optimistic: ChatMessage = {
      nanoid: `temp-${++tempIdRef.current}`,
      content: trimmed,
      sender_name: "You",
      is_deleted: false,
      created_at: sentAt.toISOString(),
    };
    replaceHistory([...messages, optimistic]);
    sendMessage(trimmed);
  };

  const online = wsReady;

  return minimized ? (
    <ChatLauncher unread={unread} online={online} onClick={openPanel} />
  ) : (
    <ChatPanel
      messages={messages}
      online={online}
      hasRoom={!!room}
      userName={userName}
      starting={starting}
      onStart={onStart}
      onMinimize={onMinimize}
      onSend={handleSend}
    />
  );
}