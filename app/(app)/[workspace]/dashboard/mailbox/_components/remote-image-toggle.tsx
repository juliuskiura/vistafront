"use client";

import { useState } from "react";

import { Image as ImageIcon } from "@/lib/icons";

/**
 * Gmail-style privacy default: remote images stay unloaded until the reader
 * explicitly allows them, so opening a message cannot beacon to a tracker.
 */
export function RemoteImageToggle({
  blocked,
  onChange,
}: {
  blocked: boolean;
  onChange: (blocked: boolean) => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (!blocked) return null;

  return (
    <button
      type="button"
      onClick={() => onChange(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex w-full items-center gap-2 border-b border-border bg-muted/50 px-4 py-2 text-left text-xs text-muted-foreground hover:bg-muted"
    >
      <ImageIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {hovered
        ? "Images are hidden — click to show them"
        : "Remote images are blocked to protect your privacy."}
    </button>
  );
}
