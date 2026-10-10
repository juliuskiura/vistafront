"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SocialIcon, hasSocialIcon } from "@/components/social-icons";
import { usePlatformStyleResolver } from "@/components/platform-icon";
import { ChannelAvatar } from "@/components/socialmanager/channel-avatar";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { useRouter } from "next/navigation";
import {
  Unlink,
  ChevronRight,
  Settings,
  Plus,
} from "@/lib/icons";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import type { ManagedChannel, SocialPlatform } from "@/lib/api/types";
import type { ChannelHealth } from "./channel-health-label";
import { ChannelActionsSheet } from "./channel-actions-sheet";
import { AccountEmailDialog } from "./account-email-dialog";

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
  /** The email of the account that connected this channel (may be empty). */
  accountEmail: string;
  /** The owning account's nanoid — needed to save a manually-added email. */
  accountNanoid: string;
  /**
   * Live health: whether the platform confirmed this channel's token works
   * right now. The Connected indicator reflects this — a channel whose token
   * is dead shows disconnected even if its row is still marked active.
   */
  health: ChannelHealth;
  syncing: boolean;
  onSync: (page: ManagedChannel) => void;
  onDisable: (page: ManagedChannel) => void;
  onDisconnect: (page: ManagedChannel) => void;
  onReconnect: (platform: SocialPlatform) => void;
  canConnect: boolean;
}

export function ChannelCard({
  page,
  ws,
  accountEmail,
  accountNanoid,
  health,
  syncing,
  onSync,
  onDisable,
  onDisconnect,
  onReconnect,
  canConnect,
}: ChannelCardProps) {
  const router = useRouter();
  const styleOf = usePlatformStyleResolver();
  const { brandOf, nameOf } = usePlatformBrand();
  const style = styleOf(page.platform);
  // Who the user signed in as: the platform whose dialog served the connect
  // (e.g. Facebook for an Instagram-via-Facebook channel) — the one that
  // declined to share an email. Falls back to the channel platform when the
  // backend didn't denormalize `auth_dialog`.
  const dialogName = nameOf(page.auth_dialog || page.platform) || page.platform;
  // Connected ⇔ the platform confirmed the token is live. `is_active` says the
  // row is enabled, which is not the same as "can this page actually connect".
  const isConnected = health.tone === "ok" || health.tone === "warn";
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

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
            <span
              className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
              title={health.label}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          ) : health.tone === "bad" ? (
            <span
              className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
              title={`${health.label} — ${health.detail}`}
            >
              <Unlink className="w-3 h-3 text-rose-600" />
              Disconnected
            </span>
          ) : page.is_active ? (
            <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Unverified
            </span>
          ) : (
            <span
              className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
              title={health.detail}
            >
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
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-slate-900 font-mono leading-none">
              {page.follower_count ? page.follower_count.toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Followers
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="shrink-0 font-semibold text-slate-900">Main Account</span>
            {accountEmail ? (
              <span className="text-right font-semibold text-slate-900 break-all">
                {accountEmail}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
                  No email found
                </span>
                <button
                  type="button"
                  onClick={() => setEmailDialogOpen(true)}
                  aria-label={`Add email for ${page.page_name || "this channel"}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[11px] font-bold text-white shadow-xs transition-colors hover:bg-primary/90"
                >
                  <Plus className="size-3" />
                  Add
                </button>
              </span>
            )}
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
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="shrink-0 gap-1.5 rounded-full px-3 text-xs"
              title="Settings for this channel"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="sm:max-w-md">
            <ChannelActionsSheet
              page={page}
              ws={ws}
              canConnect={canConnect}
              onSync={onSync}
              onDisable={onDisable}
              onDisconnect={onDisconnect}
              onReconnect={onReconnect}
            />
          </SheetContent>
        </Sheet>
      </div>

      <AccountEmailDialog
        accountNanoid={accountNanoid}
        workspaceDomain={ws}
        dialogName={dialogName}
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
      />
    </Card>
  );
}
