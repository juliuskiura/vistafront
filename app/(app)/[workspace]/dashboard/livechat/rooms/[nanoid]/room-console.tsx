"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/lib/context";
import { useTabNotification } from "@/hooks/use-tab-notification";
import { getWebSocketUrl } from "@/lib/env";
import {
  ArrowLeft,
  RefreshCw,
  UserPlus,
  ArrowRightLeft,
  XCircle,
  RotateCcw,
  MessageSquare,
  Check,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/workspace/chat-input";
import {
  assignAgent,
  closeRoom,
  reopenRoom,
  transferRoom,
  getMessages,
  type ChatAgent,
  type ChatAttachment,
  type ChatMessage,
  type ChatRoom,
} from "@/lib/api";

interface Props {
  workspaceDomain: string;
  room: ChatRoom;
  initialMessages: ChatMessage[];
  agents: ChatAgent[];
}

function bubbleClass(source: ChatMessage["source"]) {
  return source === "customer"
    ? "self-start border border-amber-200 bg-amber-50 text-slate-900 shadow-sm"
    : "self-end bg-slate-900 text-white shadow-lg shadow-slate-900/15";
}

function uniqueMessages(messages: ChatMessage[]) {
  return Array.from(
    new Map(messages.map((message) => [message.nanoid, message])).values(),
  );
}

export function RoomConsole({
  workspaceDomain,
  room: initialRoom,
  initialMessages,
  agents,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const basePath = `/${workspaceDomain}/dashboard/livechat`;

  const [room, setRoom] = useState<ChatRoom>(initialRoom);
  const hasAgent = Boolean(room.agent_name || room.agent?.user_name);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    uniqueMessages(initialMessages),
  );
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [wsReady, setWsReady] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [typingSource, setTypingSource] = useState<ChatMessage["source"] | null>(null);
  const [composerValue, setComposerValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const seenRef = useRef(
    new Set(uniqueMessages(initialMessages).map((message) => message.nanoid)),
  );
  const messagesRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingMessagesRef = useRef<
    { content: string; attachment_nanoids?: string[] }[]
  >([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { notify: notifyTab, clear: clearTabNotification } = useTabNotification();

  const scrollToBottom = useCallback(() => {
    const el = messagesRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  const appendMessage = useCallback(
    (msg: ChatMessage) => {
      if (seenRef.current.has(msg.nanoid)) return;
      seenRef.current.add(msg.nanoid);
      setMessages((prev) =>
        prev.some((message) => message.nanoid === msg.nanoid)
          ? prev
          : [...prev, msg],
      );
    },
    [],
  );

  useEffect(() => {
    if (!room.is_active) {
      return;
    }

    const wsUrl = getWebSocketUrl(`/ws/chat/${room.nanoid}/`);
    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let permanentStop = false;

    const connect = () => {
      if (cancelled || permanentStop) return;
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;
        socket.onopen = () => {
          if (!cancelled) {
            setWsReady(true);
            if (pendingMessagesRef.current.length > 0) {
              const queued = [...pendingMessagesRef.current];
              pendingMessagesRef.current = [];
              setHasPending(false);
              for (const pending of queued) {
                socket?.send(
                  JSON.stringify({
                    action: "send_message",
                    content: pending.content,
                    attachment_nanoids: pending.attachment_nanoids,
                  }),
                );
              }
            }
          }
        };
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "message") {
              appendMessage(data.message);
              if (data.message.source === "customer") {
                setTypingSource(null);
                if (remoteTypingTimerRef.current) {
                  clearTimeout(remoteTypingTimerRef.current);
                  remoteTypingTimerRef.current = null;
                }
                if (document.visibilityState === "visible") {
                  socket?.send(
                    JSON.stringify({
                      action: "mark_read",
                      message_nanoid: data.message.nanoid,
                    }),
                  );
                } else {
                  notifyTab();
                }
              }
            } else if (data.type === "attachment_added") {
              setPendingAttachments((prev) =>
                prev.some((item) => item.nanoid === data.attachment.nanoid)
                  ? prev
                  : [...prev, data.attachment],
              );
            } else if (data.type === "room_closed") {
              setRoom((current) => ({
                ...current,
                is_active: false,
                agent: null,
                agent_name: null,
              }));
              setTypingSource(null);
            } else if (data.type === "message_read") {
              setMessages((prev) => {
                const next = prev.map((message) =>
                  message.nanoid === data.message_nanoid
                    ? { ...message, is_read: true }
                    : message,
                );
                if (
                  next
                    .filter((message) => message.source === "customer")
                    .every((message) => message.is_read)
                ) {
                  clearTabNotification();
                }
                return next;
              });
            } else if (data.type === "typing") {
              if (remoteTypingTimerRef.current) {
                clearTimeout(remoteTypingTimerRef.current);
                remoteTypingTimerRef.current = null;
              }
              const remoteTyping = data.source === "customer" && data.is_typing;
              setTypingSource(remoteTyping ? "customer" : null);
              if (remoteTyping) {
                remoteTypingTimerRef.current = setTimeout(() => {
                  setTypingSource(null);
                  remoteTypingTimerRef.current = null;
                }, 3000);
              }
            }
          } catch {
            /* ignore malformed frames */
          }
        };
        socket.onclose = (e) => {
          if (cancelled) return;
          setWsReady(false);
          socket = null;
          wsRef.current = null;
          if (e.code === 4001 || e.code === 4003 || e.code === 4004) {
            permanentStop = true;
            return;
          }
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
      permanentStop = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
      socket = null;
      wsRef.current = null;
      if (remoteTypingTimerRef.current) clearTimeout(remoteTypingTimerRef.current);
      remoteTypingTimerRef.current = null;
      setTypingSource(null);
      pendingMessagesRef.current = [];
      setHasPending(false);
    };
  }, [room.nanoid, room.is_active, appendMessage, clearTabNotification, notifyTab]);

  const uploadImage = useCallback((file: File) => {
    if (!room.is_active || uploading) return;
    if (!file.type.startsWith("image/")) {
      toast.push({ variant: "error", message: "Only image files can be attached." });
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file, file.name);
    void fetch(`/api/livechat/rooms/${room.nanoid}/attachments/`, {
      method: "POST",
      headers: { "X-Workspace": workspaceDomain },
      body: formData,
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("upload failed");
        const attachment = (await response.json()) as ChatAttachment;
        setPendingAttachments((current) =>
          current.some((item) => item.nanoid === attachment.nanoid)
            ? current
            : [...current, attachment],
        );
      })
      .catch(() =>
        toast.push({ variant: "error", message: "Failed to upload image." }),
      )
      .finally(() => setUploading(false));
  }, [room.is_active, room.nanoid, toast, uploading, workspaceDomain]);

  useEffect(() => {
    if (!room.is_active || !wsReady) return;
    const markVisibleMessagesRead = () => {
      if (document.visibilityState !== "visible") return;
      for (const message of messages) {
        if (message.source === "customer" && !message.is_read) {
          wsRef.current?.send(
            JSON.stringify({
              action: "mark_read",
              message_nanoid: message.nanoid,
            }),
          );
        }
      }
    };
    markVisibleMessagesRead();
    document.addEventListener("visibilitychange", markVisibleMessagesRead);
    return () => {
      document.removeEventListener("visibilitychange", markVisibleMessagesRead);
    };
  }, [messages, room.is_active, wsReady]);

  const handleAssign = useCallback(async () => {
    setBusy(true);
    try {
      const res = await assignAgent(room.nanoid, workspaceDomain, "all");
      if (res) setRoom(res);
      toast.push({ variant: "success", message: "Agent assigned." });
    } catch {
      toast.push({
        variant: "error",
        message: "Something went wrong on the server. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }, [room.nanoid, workspaceDomain, toast]);

  const handleClose = useCallback(async () => {
    setBusy(true);
    try {
      const res = await closeRoom(room.nanoid, workspaceDomain, "all");
      if (res) setRoom(res);
      toast.push({ variant: "success", message: "Room closed." });
    } catch {
      toast.push({
        variant: "error",
        message: "Something went wrong on the server. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }, [room.nanoid, workspaceDomain, toast]);

  const handleReopen = useCallback(async () => {
    setBusy(true);
    try {
      const res = await reopenRoom(room.nanoid, workspaceDomain, "all");
      if (res) setRoom(res);
      toast.push({ variant: "success", message: "Room reopened." });
    } catch {
      toast.push({
        variant: "error",
        message: "Something went wrong on the server. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }, [room.nanoid, workspaceDomain, toast]);

  const handleTransfer = useCallback(
    async (agentNanoid: string) => {
      setBusy(true);
      try {
        const res = await transferRoom(
          room.nanoid,
          agentNanoid,
          workspaceDomain,
          "all",
        );
        if (res && "room" in res) {
          setRoom(res.room);
        }
        toast.push({ variant: "success", message: "Room transferred." });
      } catch {
        toast.push({
          variant: "error",
          message: "Something went wrong on the server. Please try again.",
        });
      } finally {
        setBusy(false);
      }
    },
    [room.nanoid, workspaceDomain, toast],
  );

  const handleRefresh = useCallback(async () => {
    try {
      const data = await getMessages(room.nanoid, workspaceDomain, "all");
      if (Array.isArray(data)) {
        const nextMessages = uniqueMessages(data);
        setMessages(nextMessages);
        seenRef.current = new Set(nextMessages.map((message) => message.nanoid));
      }
    } catch {
      /* silent */
    }
  }, [room.nanoid, workspaceDomain]);

  const handleSend = useCallback(
    (content: string) => {
      const text = content.trim();
      if (!text) return;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      wsRef.current?.send(JSON.stringify({ action: "typing", is_typing: false }));
      setComposerValue("");

      const nanoids = pendingAttachments.map((attachment) => attachment.nanoid);
      if (nanoids.length) setPendingAttachments([]);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            action: "send_message",
            content: text,
            attachment_nanoids: nanoids.length ? nanoids : undefined,
          }),
        );
        return;
      }

      pendingMessagesRef.current.push({
        content: text,
        attachment_nanoids: nanoids.length ? nanoids : undefined,
      });
      setHasPending(true);
    },
    [pendingAttachments],
  );

  useEffect(() => {
    if (!messages.length) return;
    const linked = new Set(
      messages.flatMap((message) => message.attachments?.map((a) => a.nanoid) ?? []),
    );
    if (linked.size === 0) return;
    // Drop pending previews once an incoming message owns the attachment.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingAttachments((current) =>
      current.filter((attachment) => !linked.has(attachment.nanoid)),
    );
  }, [messages]);

  const handleAttach = useCallback(
    (file: File) => {
      if (!room.is_active || uploading) return;
      if (!file.type.startsWith("image/")) {
        toast.push({ variant: "error", message: "Only image files can be attached." });
        return;
      }
      uploadImage(file);
    },
    [room.is_active, toast, uploading, uploadImage],
  );

  const handleTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ action: "typing", is_typing: isTyping }));
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (isTyping) {
      typingTimerRef.current = setTimeout(() => {
        wsRef.current?.send(JSON.stringify({ action: "typing", is_typing: false }));
      }, 3000);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(basePath)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              room.is_active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {room.is_active ? "Active" : "Closed"}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">
              {room.customer_name ?? "Customer"}
            </p>
            <p className="text-xs text-slate-500">
              {room.agent_name ? `Agent: ${room.agent_name}` : "Unassigned"}
            </p>
          </div>
{wsReady && room.is_active && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {room.is_active && !hasAgent && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void handleAssign()}
              title="Assign this room to you"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Assign to me
            </Button>
          )}
          {room.is_active && agents.length > 0 && (
            <TransferMenu
              agents={agents}
              disabled={busy}
              onTransfer={(agentNanoid) => void handleTransfer(agentNanoid)}
            />
          )}
          {room.is_active ? (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50"
              disabled={busy}
              onClick={() => void handleClose()}
              title="Close room"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Close
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void handleReopen()}
              title="Reopen room"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reopen
            </Button>
          )}
        </div>
      </div>

      <div
        ref={messagesRef}
        className="flex flex-col space-y-2 rounded-xl border bg-card p-4 min-h-[320px] max-h-[480px] overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
            <MessageSquare className="h-6 w-6 mb-2" />
            No messages yet in this room.
          </div>
        ) : (
            messages.map((message) =>
              message.is_system ? (
                <div
                  key={message.nanoid}
                  className="flex items-center gap-2 border-t border-slate-200 px-2 py-2 text-center"
                >
                  <span className="flex-1 text-xs text-slate-500">
                    {message.content}
                  </span>
                </div>
              ) : (
                <div
                  key={message.nanoid}
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${bubbleClass(message.source)}`}
                >
                  <p className="text-[10px] opacity-70 mb-0.5">
                      {message.sender_name ?? "Customer"} ·{" "}
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                  {message.is_read ? (
                    <CheckCheck className="h-3 w-3" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                    </div>
                    {Array.isArray(message.attachments) &&
                      message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {message.attachments.map((attachment) => (
                            <a
                              key={attachment.nanoid}
                              href={attachment.file}
                              target="_blank"
                              rel="noreferrer"
                              className="block max-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm"
                            >
                              <Image
                                src={attachment.file}
                                alt={attachment.file_name ?? "Attached image"}
                                width={640}
                                height={480}
                                className="block h-auto max-h-48 w-auto rounded-lg object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                  </div>
              ),
            )
        )}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {pendingAttachments.map((attachment) => (
              <div
                key={attachment.nanoid}
                className="flex items-end gap-1.5 rounded-2xl rounded-br-sm border border-dashed border-slate-400/60 bg-slate-50 p-1.5"
              >
                <a
                  href={attachment.file}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  <Image
                    src={attachment.file}
                    alt={attachment.file_name ?? "Attached image"}
                    width={160}
                    height={120}
                    className="block h-auto max-h-24 w-auto rounded-lg object-cover"
                  />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

        {room.is_active ? (
          <div className="rounded-xl border bg-card p-3">
            <ChatInput
              variant="admin"
              value={composerValue}
              onChange={setComposerValue}
              onSend={handleSend}
              onAttach={handleAttach}
              onTyping={handleTyping}
              typing={typingSource === "customer"}
              typingLabel="Customer is typing..."
              disabled={uploading}
              statusMessage={hasPending && (
                <span className="text-[10px] text-amber-600">
                  Reconnecting — messages will send when online
                </span>
              )}
            />
          </div>
        ) : null}
    </div>
  );
}

function TransferMenu({
  agents,
  disabled,
  onTransfer,
}: {
  agents: ChatAgent[];
  disabled: boolean;
  onTransfer: (agentNanoid: string) => void;
}) {
  const [target, setTarget] = useState("");

  return (
    <div className="flex items-center gap-1">
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
      >
        <option value="">Transfer to…</option>
        {agents.map((a) => (
          <option key={a.nanoid} value={a.nanoid}>
            {a.user_name}
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || !target}
        onClick={() => {
          onTransfer(target);
          setTarget("");
        }}
        title="Transfer to the selected agent"
      >
        <ArrowRightLeft className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}