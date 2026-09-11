"use client";

import { ChatIcon } from "@/lib/icons";

interface ChatLauncherProps {
  unread: number;
  online: boolean;
  onClick: () => void;
}

export function ChatLauncher({ unread, online, onClick }: ChatLauncherProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open chat"
      title="Open chat"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl active:translate-y-0"
    >
      <ChatIcon size={28} />
      <span
        className={`absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-background ${
          online ? "bg-emerald-500" : "bg-muted-foreground/50"
        }`}
      />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground shadow-sm">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}