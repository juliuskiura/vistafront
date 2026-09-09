"use client";

import Link from "next/link";
import { AlertCircle, BarChart3, Lock, PenLine, RefreshCw, ShieldCheck, Users } from "lucide-react";

import type { ManagedChannel, SocialMediaPlatform } from "@/lib/api/types";
import { getPlatformStyle, PlatformGlyph } from "@/components/platform-icon";
import { hasSocialIcon, SocialIcon } from "@/components/social-icons";
import { cn } from "@/lib/utils";
import { getPlatformGradient, type TokenHealth } from "./platform-gradients";

interface ChannelHeroProps {
  channel: ManagedChannel;
  token: TokenHealth;
  isSyncing: boolean;
  isActive: boolean;
  igLoading: boolean;
  onSync: () => void;
  onGetInstagram: () => void;
  basePath: string;
  platforms: SocialMediaPlatform[];
}

const TOKEN_PILL: Record<TokenHealth["status"], { label: (d: number | null) => string; className: string }> = {
  active: {
    label: (d) => (d !== null ? `Token active (${d}d left)` : "Token active"),
    className: "bg-emerald-500/20 text-emerald-50 ring-emerald-300/40",
  },
  expiring_soon: {
    label: (d) => `Token expires in ${d}d`,
    className: "bg-amber-400/20 text-amber-50 ring-amber-300/40",
  },
  expired: {
    label: () => "Token expired",
    className: "bg-rose-500/20 text-rose-50 ring-rose-300/40",
  },
};

export function ChannelHero({
  channel,
  token,
  isSyncing,
  isActive,
  igLoading,
  onSync,
  onGetInstagram,
  basePath,
  platforms,
}: ChannelHeroProps) {
  const style = getPlatformStyle(channel.platform);
  const platform = platforms.find((p) => p.slug === channel.platform);
  const tokenPill = TOKEN_PILL[token.status];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br shadow-xl ring-1 ring-white/10",
        getPlatformGradient(channel.platform),
      )}
    >
      {channel.cover_photo_url && (
        <div className="absolute inset-0">
          <img
            src={channel.cover_photo_url}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/60" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)]" />

      <div className="relative flex flex-col gap-5 p-6 text-white md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold",
              style.bg,
              style.color,
              style.border,
            )}
          >
            {hasSocialIcon(channel.platform) ? (
              <SocialIcon name={channel.platform} className={cn("h-3.5 w-3.5", style.color)} />
            ) : (
              <PlatformGlyph platform={channel.platform} size="sm" />
            )}
            <span className="capitalize">{style.label}</span>
          </span>

          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-50 ring-1 ring-emerald-300/40 backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-1 text-[10px] font-bold text-rose-50 ring-1 ring-rose-300/40 backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-rose-300" />
              Disconnected
            </span>
          )}

          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 backdrop-blur-sm",
              tokenPill.className,
            )}
          >
            {token.status === "active" && <ShieldCheck className="size-3" />}
            {token.status === "expiring_soon" && <AlertCircle className="size-3" />}
            {token.status === "expired" && <Lock className="size-3" />}
            {tokenPill.label(token.days)}
          </span>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              {channel.profile_picture_url ? (
                <img
                  src={channel.profile_picture_url}
                  alt={channel.page_name}
                  className="size-20 rounded-2xl border border-white/30 object-cover shadow-lg ring-4 ring-white/25"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-lg font-bold text-white backdrop-blur-sm ring-4 ring-white/25">
                  {channel.page_name?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5">
                {hasSocialIcon(channel.platform) ? (
                  <SocialIcon name={channel.platform} className={cn("size-3.5", style.color)} />
                ) : (
                  <PlatformGlyph platform={channel.platform} size="sm" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-bold tracking-tight text-white">
                  {channel.page_name}
                </h1>
                {platform && (
                  <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white ring-1 ring-white/20 backdrop-blur-sm">
                    {platform.name}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate font-mono text-xs text-white/80">
                {channel.username ? `@${channel.username}` : channel.platform_name}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-3 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20 backdrop-blur-sm">
                  <Users className="size-3.5 text-white/80" />
                  {channel.follower_count ? channel.follower_count.toLocaleString() : "—"} followers
                </span>
                {channel.category && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
                    {channel.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-primary shadow-[inset_0_2px_0_rgba(0,0,0,0.06),0_4px_10px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[inset_0_2px_0_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.3)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
            >
              <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
              {isSyncing ? "Syncing…" : "Sync from Channel"}
            </button>

            <Link
              href={`${basePath}/compose`}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-xs font-bold text-white ring-1 ring-white/25 backdrop-blur-md transition-all hover:bg-white/25"
            >
              <PenLine className="size-4" />
              Compose
            </Link>

            <Link
              href={`${basePath}/analytics`}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-xs font-bold text-white ring-1 ring-white/25 backdrop-blur-md transition-all hover:bg-white/25"
            >
              <BarChart3 className="size-4" />
              Analytics
            </Link>

            {channel.platform === "facebook" && (
              <button
                type="button"
                onClick={onGetInstagram}
                disabled={igLoading}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-xs font-bold text-white ring-1 ring-white/25 backdrop-blur-md transition-all hover:bg-white/25 disabled:pointer-events-none disabled:opacity-60"
              >
                <SocialIcon name="instagram" className={cn("size-4", igLoading && "animate-spin")} />
                {igLoading ? "Checking…" : "Get Connected Instagram"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}