"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/context";
import {
  ArrowLeft,
  RefreshCw,
  UserPlus,
  ArrowRightLeft,
  XCircle,
  RotateCcw,
  MessageSquare,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  assignAgent,
  closeRoom,
  reopenRoom,
  transferRoom,
  getMessages,
  type ChatAgent,
  type ChatMessage,
  type ChatRoom,
} from "@/lib/api";

interface Props {
  workspaceDomain: string;
  room: ChatRoom;
  initialMessages: ChatMessage[];
  agents: ChatAgent[];
}

function bubbleClass(senderName: string | null) {
  if (senderName === "You") {
    return "bg-indigo-600 text-white self-end";
  }
  return "bg-slate-100 text-slate-900 self-start";
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
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [busy, setBusy] = useState(false);
  const [wsReady, setWsReady] = useState(false);
  const [composerValue, setComposerValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const seenRef = useRef(new Set(initialMessages.map((m) => m.nanoid)));
  const messagesRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

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
      setMessages((prev) => [...prev, msg]);
    },
    [],
  );

  useEffect(() => {
    if (!room.is_active) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/chat/${room.nanoid}/`;
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
          if (!cancelled) setWsReady(true);
        };
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "message") {
              appendMessage(data.message);
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
    };
  }, [room.nanoid, room.is_active, appendMessage]);

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
        setMessages(data);
        seenRef.current = new Set(data.map((m) => m.nanoid));
      }
    } catch {
      /* silent */
    }
  }, [room.nanoid, workspaceDomain]);

  const handleSend = useCallback(async () => {
    const text = composerValue.trim();
    if (!text) return;
    setComposerValue("");
    requestAnimationFrame(resize);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: "send_message", content: text }),
      );
      return;
    }

    try {
      const res = await fetch(`/api/livechat/messages?room=${room.nanoid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error("send failed");
    } catch {
      toast.push({ variant: "error", message: "Failed to send message" });
    }
  }, [composerValue, room.nanoid, toast, resize]);

  const sendKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              room.is_active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {room.is_active ? "Active" : "Closed"}
          </span>
          <p className="text-sm font-semibold text-slate-900">
            {room.customer_name ?? "Customer"}
          </p>
          {room.agent_name && (
            <p className="text-xs text-slate-500">
              Agent: {room.agent_name}
            </p>
          )}
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
          {room.is_active && (
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
          messages.map((message) => (
            <div
              key={message.nanoid}
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${bubbleClass(
                message.sender_name,
              )}`}
            >
              <p className="text-[10px] opacity-70 mb-0.5">
                {message.sender_name ?? "System"} ·{" "}
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="rounded-xl border bg-card p-3">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-300/30">
          <div className="px-3 pt-2.5">
            <Textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={composerValue}
              onChange={(e) => {
                setComposerValue(e.target.value);
                requestAnimationFrame(resize);
              }}
              onKeyDown={sendKeyDown}
              rows={1}
              className="flex min-h-[40px] w-full resize-none overflow-hidden border-none bg-transparent p-0 text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex items-center justify-end border-t border-slate-100 px-2.5 py-1.5">
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!composerValue.trim()}
              aria-label="Send message"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:pointer-events-none disabled:opacity-45"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
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