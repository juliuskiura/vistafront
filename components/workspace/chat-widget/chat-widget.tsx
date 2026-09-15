"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatRoom } from "./use-chat-room";
import { useChatSocket } from "./use-chat-socket";
import { useToast } from "@/lib/context";
import { ChatLauncher } from "./_components/chat-launcher";
import { ChatPanel } from "./_components/chat-panel";
import type { ChatAttachment, ChatMessage, ChatRoom } from "./types";

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
      const res = await fetch("/api/livechat/rooms/", { method: "POST" });
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
        `/api/livechat/rooms/${nanoid}/close/`,
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

  const room = isPending || !currentRoom?.nanoid ? null : currentRoom;

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
  const [unread, setUnread] = useState(room?.unread_count ?? 0);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const { push: toast } = useToast();

  const { data: history } = useQuery<ChatMessage[]>({
    queryKey: ["chatMessages", room?.nanoid],
    queryFn: () =>
      fetch(`/api/livechat/${room?.nanoid}/messages/`).then((r) => r.json()),
    enabled: !!room?.nanoid,
  });
  const { data: roomAttachments } = useQuery<ChatAttachment[]>({
    queryKey: ["chatAttachments", room?.nanoid],
    queryFn: () =>
      fetch(`/api/livechat/rooms/${room?.nanoid}/attachments/`).then((r) => r.json()),
    enabled: !!room?.nanoid,
  });

  const {
    messages,
    replaceHistory,
    wsReady,
    hasPending,
    sendMessage,
    markRead,
    sendTyping,
    typingSource,
  } = useChatSocket({
    roomNanoid: room?.nanoid,
    minimizedRef,
    userName,
    onUnread: () => setUnread((u) => u + 1),
    onAttachment: (attachment) =>
      setAttachments((current) =>
        current.some((item) => item.nanoid === attachment.nanoid)
          ? current
          : [...current, attachment],
      ),
  });

  useEffect(() => {
    if (roomAttachments) {
      // Synchronize the initial room attachment query with live socket additions.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAttachments(roomAttachments);
    }
  }, [roomAttachments]);

  const markVisibleMessagesRead = useCallback(() => {
    if (!room || minimized || document.visibilityState !== "visible") return;
    for (const message of messages) {
      if (message.source === "admin" && !message.is_read) {
        markRead(message.nanoid);
      }
    }
    setUnread(0);
  }, [markRead, messages, minimized, room]);

  useEffect(() => {
    if (history) {
      replaceHistory(history);
    }
  }, [history, replaceHistory]);

  useEffect(() => {
    if (!room || minimized || !wsReady) return;
    // Read acknowledgements are sent when the conversation becomes visible.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    markVisibleMessagesRead();
    document.addEventListener("visibilitychange", markVisibleMessagesRead);
    return () => {
      document.removeEventListener("visibilitychange", markVisibleMessagesRead);
    };
  }, [markVisibleMessagesRead, minimized, room, wsReady]);

  const handleSend = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !room?.nanoid) return;

    sendMessage(trimmed);
  };

  const handleAttach = (file: File) => {
    if (!room?.nanoid || uploading) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "error", message: "Only image files can be attached" });
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file, file.name);
    void fetch(`/api/livechat/rooms/${room.nanoid}/attachments/`, {
      method: "POST",
      body: formData,
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("upload failed");
        const attachment = (await response.json()) as ChatAttachment;
        setAttachments((current) =>
          current.some((item) => item.nanoid === attachment.nanoid)
            ? current
            : [...current, attachment],
        );
      })
      .catch(() => toast({ variant: "error", message: "Failed to upload image" }))
      .finally(() => setUploading(false));
  };

  const online = wsReady;

  return minimized ? (
    <ChatLauncher
      unread={unread}
      online={online}
      onClick={onOpen}
    />
  ) : (
    <ChatPanel
      messages={messages}
        attachments={attachments}
      online={online}
        hasRoom={!!room}
      starting={starting}
      hasPending={hasPending}
      onStart={onStart}
      onClose={onClose}
      onMinimize={onMinimize}
      onSend={handleSend}
        onAttach={handleAttach}
        onTyping={sendTyping}
        typing={typingSource === "admin"}
    />
  );
}
