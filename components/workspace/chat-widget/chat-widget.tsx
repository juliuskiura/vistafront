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
  const roomNanoidRef = useRef<string | null>(null);

  useEffect(() => {
    minimizedRef.current = minimized;
  }, [minimized]);

  const { currentRoom, isPending } = useChatRoom();
  const queryClient = useQueryClient();
  const { push: toast } = useToast();

  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);

  useEffect(() => {
    if (currentRoom?.nanoid) {
      roomNanoidRef.current = currentRoom.nanoid;
    }
  }, [currentRoom]);

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
      setMinimized(false);
    }
  };

  const handleClose = async () => {
    const nanoid = roomNanoidRef.current;
    if (!nanoid) return;
    try {
      await fetch(
        `/api/livechat/rooms/${nanoid}/close`,
        { method: "POST", credentials: "include" }
      );
    } catch {
      toast({ variant: "error", message: "Failed to close chat" });
      return;
    }
    roomNanoidRef.current = null;
    queryClient.removeQueries({ queryKey: ["chatRooms"] });
    queryClient.removeQueries({ queryKey: ["chatMessages", nanoid] });
    setMinimized(true);
  };

  const handleOpen = () => {
    setMinimized(false);
  };

  const room = isPending ? null : currentRoom;

  return (
    <ChatWidgetInner
      room={room}
      minimized={minimized}
      minimizedRef={minimizedRef}
      userName={userName}
      starting={starting}
      onStart={handleStart}
      onMinimize={() => setMinimized(true)}
      onOpen={handleOpen}
      onClose={handleClose}
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
  onClose: () => void;
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
  onClose,
}: ChatWidgetInnerProps) {
  const [unread, setUnread] = useState(0);
  const tempIdRef = useRef(0);
  const { push: toast } = useToast();

  const { data: history } = useQuery<ChatMessage[]>({
    queryKey: ["chatMessages", room?.nanoid],
    queryFn: () =>
      fetch(`/api/livechat/messages?room=${room?.nanoid}`).then((r) => r.json()),
    enabled: !!room?.nanoid,
  });

  const { messages, replaceHistory, wsReady, sendMessage } = useChatSocket({
    roomNanoid: room?.nanoid,
    minimizedRef,
    userName,
    onUnread: () => setUnread((u) => u + 1),
  });

  useEffect(() => {
    if (history) {
      replaceHistory(history);
    }
  }, [history, replaceHistory]);

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
    <ChatLauncher unread={unread} online={online} onClick={onOpen} />
  ) : (
    <ChatPanel
      messages={messages}
      online={online}
      hasRoom={!!room}
      userName={userName}
      starting={starting}
      onStart={onStart}
      onClose={onClose}
      onMinimize={onMinimize}
      onSend={handleSend}
    />
  );
}
