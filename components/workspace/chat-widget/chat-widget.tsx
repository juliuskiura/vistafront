"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatRoom } from "./use-chat-room";
import { useChatSocket } from "./use-chat-socket";
import { useToast } from "@/lib/context";
import { ChatLauncher } from "./_components/chat-launcher";
import { ChatPanel } from "./_components/chat-panel";
import type { ChatMessage, ChatRoom } from "./types";

const ROOM_STORAGE_KEY = "vistasolve.chat.room.nanoid";

const roomListeners = new Set<() => void>();

function handleStorageEvent(event: StorageEvent) {
  if (event.key === ROOM_STORAGE_KEY) {
    roomListeners.forEach((listener) => listener());
  }
}

function getStoredRoomNanoid(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ROOM_STORAGE_KEY);
}

function subscribeToStoredRoom(onChange: () => void): () => void {
  roomListeners.add(onChange);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }
  return () => {
    roomListeners.delete(onChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

function setStoredRoomNanoid(nanoid: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROOM_STORAGE_KEY, nanoid);
  roomListeners.forEach((listener) => listener());
}

interface ChatWidgetProps {
  userName?: string | null;
  isAuthenticated?: boolean;
}

export function ChatWidget({
  userName = null,
  isAuthenticated = false,
}: ChatWidgetProps) {
  const [minimized, setMinimized] = useState(true);
  const minimizedRef = useRef(true);

  useEffect(() => {
    minimizedRef.current = minimized;
  }, [minimized]);

  const { currentRoom: authedRoom } = useChatRoom(isAuthenticated);

  const storedRoomNanoid = useSyncExternalStore(
    subscribeToStoredRoom,
    getStoredRoomNanoid,
    () => null,
  );

  const anonRoom: ChatRoom | null = isAuthenticated
    ? null
    : storedRoomNanoid
      ? {
          nanoid: storedRoomNanoid,
          is_active: true,
          agent_name: null,
          customer_name: null,
          created_at: "",
        }
      : null;

  const room = isAuthenticated ? authedRoom : anonRoom;

  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const queryClient = useQueryClient();
  const { push: toast } = useToast();

  const handleStart = async () => {
    if (startingRef.current || room) return;
    startingRef.current = true;
    setStarting(true);
    try {
      const res = await fetch("/api/livechat/rooms", { method: "POST" });
      if (!res.ok) throw new Error("create failed");
      const newRoom = (await res.json()) as ChatRoom;
      if (!isAuthenticated) {
        setStoredRoomNanoid(newRoom.nanoid);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
      }
    } catch {
      toast({ variant: "error", message: "Failed to open a chat" });
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  };

  return (
    <ChatWidgetInner
      key={room?.nanoid ?? "no-room"}
      room={room}
      minimized={minimized}
      minimizedRef={minimizedRef}
      userName={userName}
      isAuthenticated={isAuthenticated}
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
  isAuthenticated: boolean;
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
  isAuthenticated,
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
    useWebSocket: isAuthenticated,
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

  const online = wsReady || !isAuthenticated;

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