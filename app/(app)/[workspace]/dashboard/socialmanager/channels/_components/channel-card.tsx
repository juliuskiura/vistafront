"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SocialIcon, hasSocialIcon } from "@/components/social-icons";
import { usePlatformStyleResolver } from "@/components/platform-icon";
import { ChannelAvatar } from "@/components/socialmanager/channel-avatar";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertCircle,
  Lock,
  Unlink,
  RefreshCw,
  ChevronRight,
} from "@/lib/icons";
import type { ManagedChannel, SocialPlatform } from "@/lib/api/types";
import type { ChannelHealth } from "./channel-health-label";

const TONE_TEXT: Record<ChannelHealth["tone"], string> = {
  ok: "text-emerald-600",
  warn: "text-amber-600",
  bad: "text-rose-600",
  unknown: "text-slate-500",
};

const TONE_ICON: Record<ChannelHealth["tone"], typeof ShieldCheck> = {
  ok: ShieldCheck,
  warn: AlertCircle,
  bad: Lock,
  unknown: AlertCircle,
};

function toLocalDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface ChannelCardProps {
  page: ManagedChannel;
  ws: string;
  health: ChannelHealth;
  syncing: boolean;
  onSync: (page: ManagedChannel) => void;
  onDisconnect: (page: ManagedChannel) => void;
  onReconnect: (platform: SocialPlatform) => void;
  canConnect: boolean;
}

export function ChannelCard({
  page,
  ws,
  health,
  syncing,
  onSync,
  onDisconnect,
  onReconnect,
  canConnect,
}: ChannelCardProps) {
  const router = useRouter();
  const styleOf = usePlatformStyleResolver();
  const { brandOf } = usePlatformBrand();
  const style = styleOf(page.platform);
  const isConnected = page.is_active;
  const HealthIcon = TONE_ICON[health.tone];

  return (
    <Card className="p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${style.bg} ${style.border} ${style.color}`}
          >
            {hasSocialIcon(brandOf(page.platform)) ? (
              <SocialIcon
                name={brandOf(page.platform)}
                className={`h-3.5 w-3.5 ${style.color}`}
              />
            ) : (
              <span
                className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[9px] font-bold ${style.bg} ${style.color} border ${style.border}`}
              >
                {style.label.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="capitalize">{style.label}</span>
          </span>
          {isConnected ? (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Unlink className="w-3 h-3 text-rose-600" />
              Disconnected
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <ChannelAvatar
              nanoid={page.nanoid}
              pictureUrl={page.profile_picture_url}
              workspace={ws}
              alt={page.page_name}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs"
              fallback={
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                  {page.page_name?.slice(0, 2).toUpperCase()}
                </div>
              }
            />
            <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs">
              {hasSocialIcon(brandOf(page.platform)) ? (
                <SocialIcon
                  name={brandOf(page.platform)}
                  className={`w-4 h-4 ${style.color}`}
                />
              ) : (
                <span
                  className={`w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-bold ${style.bg} ${style.color} border ${style.border}`}
                >
                  {style.label.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {page.page_name}
            </h4>
            <p className="text-xs font-mono text-slate-500 truncate">
              {page.username ? `@${page.username}` : page.platform_name}
            </p>
            {page.category && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium mt-1 inline-block">
                {page.category}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>Followers:</span>
            <span className="font-bold text-slate-900 font-mono">
              {page.follower_count ? page.follower_count.toLocaleString() : "—"}
            </span>
          </div>
          <div className="flex justify-between items-start gap-3 text-slate-600">
            <span className="shrink-0">Token Health:</span>
            <span className={`text-right ${TONE_TEXT[health.tone]}`}>
              <span className="font-medium inline-flex items-center gap-1">
                <HealthIcon className="w-3 h-3" />
                {health.label}
              </span>
              {health.detail && (
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  {health.detail}
                </span>
              )}
            </span>
          </div>
          {page.updated_at && (
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span>Last updated:</span>
              <span>{toLocalDateTime(page.updated_at)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
        <button
          onClick={() =>
            router.push(`/${ws}/dashboard/socialmanager/channels/${page.nanoid}`)
          }
          className="text-[11px] font-semibold text-slate-600 hover:text-primary flex items-center gap-1 transition-colors"
        >
          View details
          <ChevronRight className="w-3 h-3" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSync(page)}
            disabled={syncing}
            title="Re-reads this account's pages and mints a fresh token for each"
            className="text-[11px] font-semibold text-primary hover:text-primary-700 flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-wait"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            Sync Audience
          </button>
          <Button
            onClick={() =>
              isConnected
                ? onDisconnect(page)
                : onReconnect(page.platform as SocialPlatform)
            }
            disabled={!isConnected && !canConnect}
            variant={isConnected ? "outline" : "default"}
            className={
              isConnected
                ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }
            size="sm"
          >
            {isConnected ? "Disconnect" : "Reconnect"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
