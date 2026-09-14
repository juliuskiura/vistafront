"use client";

import { MessageSquare } from "lucide-react";
import type { RoomFeedRoom } from "../rooms-feed";

interface SubjectQueryCellProps {
  room: RoomFeedRoom;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "…";
}

export function SubjectQueryCell({ room }: SubjectQueryCellProps) {
  const { last_message } = room;

  if (!last_message) {
    return (
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        <span className="text-sm text-muted-foreground">No messages yet</span>
      </div>
    );
  }

  const senderLabel =
    last_message.sender_name === "You"
      ? "You"
      : last_message.sender_name ?? "Customer";

  const queryText = truncate(last_message.content, 90);

  return (
    <div className="max-w-[320px]">
      <p className="text-sm font-medium text-foreground">{senderLabel}</p>
      <p className="text-sm text-muted-foreground truncate leading-tight">
        {queryText || <span className="italic">Sent an attachment</span>}
      </p>
      {last_message.created_at && (
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          {new Date(last_message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
