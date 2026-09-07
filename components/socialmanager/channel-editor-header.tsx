"use client";

import type { ManagedChannel, SocialMediaPlatform } from "@/lib/api/types";
import { PlatformGlyph, getPlatformStyle } from "@/components/platform-icon";

interface ChannelEditorHeaderProps {
  channel: ManagedChannel;
  platform: SocialMediaPlatform;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function ChannelEditorHeader({
  channel,
  platform,
}: ChannelEditorHeaderProps) {
  const brandColor = platform.color ?? "#94a3b8";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <div className="relative shrink-0">
        {channel.profile_picture_url ? (
          <img
            src={channel.profile_picture_url}
            alt=""
            className="h-10 w-10 rounded-full object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 text-sm font-bold text-white shadow-sm">
            {initials(channel.page_name)}
          </div>
        )}
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white"
          style={{ backgroundColor: brandColor }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {channel.page_name}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: brandColor }}
          />
          {platform.name}
        </p>
      </div>
    </div>
  );
}
