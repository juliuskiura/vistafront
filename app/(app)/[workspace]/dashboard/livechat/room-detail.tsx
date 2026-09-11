"use client";

import { useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  UserPlus,
  ArrowRightLeft,
  XCircle,
  RotateCcw,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatAgent, ChatMessage, ChatRoom } from "@/lib/api";

interface Props {
  room: ChatRoom;
  agents: ChatAgent[];
  messages: ChatMessage[];
  loading: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onAssign: () => Promise<boolean>;
  onTransfer: (agentNanoid: string) => Promise<boolean>;
  onClose: () => Promise<boolean>;
  onReopen: () => Promise<boolean>;
}

function bubbleClass(senderName: string | null) {
  if (senderName === "You") {
    return "bg-indigo-600 text-white self-end";
  }
  return "bg-slate-100 text-slate-900 self-start";
}

export function RoomDetail({
  room,
  agents,
  messages,
  loading,
  onBack,
  onRefresh,
  onAssign,
  onTransfer,
  onClose,
  onReopen,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");

  const run = async (action: () => Promise<boolean>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
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
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {room.is_active && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => run(onAssign)}
              title="Assign this room to you"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Assign to me
            </Button>
          )}
          {room.is_active && agents.length > 0 && (
            <div className="flex items-center gap-1">
              <select
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
              >
                <option value="">Transfer to…</option>
                {agents.map((agent) => (
                  <option key={agent.nanoid} value={agent.nanoid}>
                    {agent.user_name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={busy || !transferTarget}
                onClick={() => run(() => onTransfer(transferTarget))}
                title="Transfer to the selected agent"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {room.is_active ? (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50"
              disabled={busy}
              onClick={() => run(onClose)}
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
              onClick={() => run(onReopen)}
              title="Reopen room"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reopen
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-2 rounded-xl border bg-card p-4 min-h-[320px] max-h-[480px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
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
                {message.sender_name ?? "Customer"} ·{" "}
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
    </div>
  );
}