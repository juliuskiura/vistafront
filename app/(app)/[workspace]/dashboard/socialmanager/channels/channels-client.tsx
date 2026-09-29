"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SocialIcon, hasSocialIcon } from "@/components/social-icons";
import { usePlatformStyleResolver } from "@/components/platform-icon";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { useConnectAccount } from "@/lib/context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { syncAccountAction, disconnectChannelAction } from "../actions";
import type { ManagedChannel, SocialAccount, SocialPlatform } from "@/lib/api/types";
import { ShieldCheck, AlertCircle, Lock, Unlink, RefreshCw, ChevronRight, Plus } from "@/lib/icons";

interface Props {
  channels: ManagedChannel[];
  workspaceDomain: string;
  pageToAccountNanoid: Record<string, string>;
  /**
   * All connected accounts, used only to detect page-less Door 2
   * (`instagram`) accounts whose backend sync produced zero channels
   * (e.g. a Personal account). Those never enter the
   * `discoverChannels`/`syncChannelSelection` picker — there is nothing
   * to pick — so they surface as a guided Reconnect notice instead.
   */
  accounts?: SocialAccount[];
}

function getTokenStatus(expiresAt: string | null): { status: "active" | "expiring_soon" | "expired"; days: number | null } {
  if (!expiresAt) return { status: "active", days: null };
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const days = Math.floor((expiry - now) / 86400000);
  if (expiry <= now) return { status: "expired", days: 0 };
  if (days <= 14) return { status: "expiring_soon", days };
  return { status: "active", days };
}

function toLocaleDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChannelsClient({ channels, workspaceDomain, pageToAccountNanoid, accounts = [] }: Props) {
  const ws = workspaceDomain.toLowerCase();
  // The connect flow belongs to ConnectAccountProvider — one modal instance for
  // the whole app. This page just states *what* it wants: a bare open for the
  // header button, and a preselected platform + rerequest for Reconnect.
  const { open: openConnectAccount, canConnect } = useConnectAccount();
  // A channel reports the door it connected through (`instagramfb`); its icon
  // and label come from that door's `auth_destination` (`instagram`).
  const { brandOf } = usePlatformBrand();
  const styleOf = usePlatformStyleResolver();
  const [disconnectTarget, setDisconnectTarget] = useState<ManagedChannel | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const router = useRouter();

  const activeCount = channels.filter((page) => page.is_active).length;

  // Page-less Door 2 (`instagram`) accounts with no synced channels: the
  // backend keeps the `SocialAccount` row but writes no `ManagedChannel`
  // (Personal account type, or a sync that produced nothing). There is no
  // picker for these — one account maps to one mirror channel — so guide
  // the user to switch to Business/Creator and Reconnect the same door.
  const instagramPendingAccounts = accounts.filter(
    (account) =>
      account.platform === "instagram" &&
      (account.managed_pages ?? []).length === 0,
  );

  const handleSync = useCallback(
    async (page: ManagedChannel) => {
      setSyncingId(page.nanoid);
      const accountNanoid = pageToAccountNanoid[page.nanoid];
      if (accountNanoid) await syncAccountAction(accountNanoid, ws);
      setSyncingId(null);
      router.refresh();
    },
    [ws, router, pageToAccountNanoid],
  );

  const handleDisconnect = useCallback(
    async (page: ManagedChannel) => {
      await disconnectChannelAction(page.nanoid, ws);
      router.refresh();
    },
    [ws, router],
  );

  const handleConfirmDisconnect = useCallback(async () => {
    if (!disconnectTarget) return;
    setDisconnecting(true);
    try {
      await handleDisconnect(disconnectTarget);
    } finally {
      setDisconnecting(false);
    }
  }, [disconnectTarget, handleDisconnect]);

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-3xl border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold text-slate-900 text-xl">Connected Social Channels</h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {activeCount} Active Channels
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Manage your connected social accounts. Posts created in the composer will automatically sync with your selected active channels.
          </p>
        </div>
        <Button
          onClick={() => openConnectAccount()}
          disabled={!canConnect}
          title={
            canConnect
              ? "Link a social account to cross-post"
              : "Your plan does not include social publishing"
          }
          className="flex items-center justify-center gap-2 bg-primary text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0 disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          <span>Connect New Channel</span>
        </Button>
      </div>

      {instagramPendingAccounts.length > 0 && (
        <Card className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-amber-900">
                Instagram needs a Business or Creator account
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                {instagramPendingAccounts.length === 1
                  ? `“${instagramPendingAccounts[0].account_name || instagramPendingAccounts[0].short_name || "Your Instagram account"}” connected, but Instagram only allows publishing from Business or Creator accounts. Switch the account type in the Instagram app, then reconnect — no Facebook Page needed.`
                  : `${instagramPendingAccounts.length} Instagram accounts connected, but Instagram only allows publishing from Business or Creator accounts. Switch the account type in the Instagram app, then reconnect — no Facebook Page needed.`}
              </p>
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={() =>
                    openConnectAccount({
                      preselectedPlatform: "instagram" as SocialPlatform,
                      rerequest: true,
                    })
                  }
                  disabled={!canConnect}
                  className="bg-amber-600 text-white hover:bg-amber-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Reconnect Instagram
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {channels.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border border-slate-200">
          <p className="text-sm text-slate-500">No social channels connected yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((page) => {
            const isConnected = page.is_active;
            const style = styleOf(page.platform);
            const token = getTokenStatus(page.token_expires_at);
            return (
              <Card
                key={page.nanoid}
                className="p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${style.bg} ${style.border} ${style.color}`}
                  >
                    {hasSocialIcon(brandOf(page.platform)) ? (
                      <SocialIcon name={brandOf(page.platform)} className={`h-3.5 w-3.5 ${style.color}`} />
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
                    {page.profile_picture_url ? (
                      <img
                        src={page.profile_picture_url}
                        alt={page.page_name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                        {page.page_name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs">
                      {hasSocialIcon(brandOf(page.platform)) ? (
                        <SocialIcon name={brandOf(page.platform)} className={`w-4 h-4 ${style.color}`} />
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
                    <h4 className="text-sm font-bold text-slate-900 truncate">{page.page_name}</h4>
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
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Token Health:</span>
                    {token.status === "active" ? (
                      <span className="font-medium text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {token.days !== null ? `Active (${token.days}d left)` : "Active"}
                      </span>
                    ) : token.status === "expiring_soon" ? (
                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Expires in {token.days}d
                      </span>
                    ) : (
                      <span className="font-medium text-rose-600 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Token Expired
                      </span>
                    )}
                  </div>
                  {page.updated_at && (
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>Last Synced:</span>
                      <span>{toLocaleDateTime(page.updated_at)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => router.push(`/${ws}/dashboard/socialmanager/channels/${page.nanoid}`)}
                    className="text-[11px] font-semibold text-slate-600 hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    View details
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleSync(page)}
                    disabled={syncingId === page.nanoid}
                    className="text-[11px] font-semibold text-primary hover:text-primary-700 flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-wait"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncingId === page.nanoid ? "animate-spin" : ""}`} />
                    Sync Audience
                  </button>
                  <Button
                    onClick={() =>
                      isConnected
                        ? setDisconnectTarget(page)
                        : openConnectAccount({
                            preselectedPlatform: page.platform as SocialPlatform,
                            rerequest: true,
                          })
                    }
                    disabled={!isConnected && !canConnect}
                    variant={isConnected ? "outline" : "default"}
                    className={isConnected ? "border-rose-200 text-rose-700 hover:bg-rose-50" : "bg-emerald-600 text-white hover:bg-emerald-700"}
                    size="sm"
                  >
                    {isConnected ? "Disconnect" : "Reconnect"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={disconnectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDisconnectTarget(null);
        }}
        title="Disconnect channel?"
        description="This will revoke access to this channel and remove it from your connected channels. Posts already published will not be deleted."
        confirmLabel={disconnecting ? "Disconnecting…" : "Disconnect"}
        variant="destructive"
        onConfirm={handleConfirmDisconnect}
        confirming={disconnecting}
      />
    </div>
  );
}
