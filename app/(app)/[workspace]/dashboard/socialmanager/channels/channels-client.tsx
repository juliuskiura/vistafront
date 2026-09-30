"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useConnectAccount } from "@/lib/context";
import { RefreshCw, AlertCircle, Plus } from "@/lib/icons";
import { syncAccountAction, disconnectChannelAction } from "../actions";
import { ChannelCard } from "./_components/channel-card";
import { describeChannelHealth, type VerifyVerdict } from "./_components/channel-health-label";
import type { ManagedChannel, SocialAccount, SocialPlatform } from "@/lib/api/types";

interface Props {
  channels: ManagedChannel[];
  workspaceDomain: string;
  pageToAccountNanoid: Record<string, string>;
  /**
   * A live `POST /pages/{nanoid}/verify/` answer per active channel, resolved on
   * the server before first paint. `undefined` for a channel we chose not to
   * check (see the cap in `page.tsx`) and for every disconnected channel.
   */
  verdicts?: Record<string, VerifyVerdict>;
  /**
   * All connected accounts, used only to detect page-less Door 2
   * (`instagram`) accounts whose backend sync produced zero channels
   * (e.g. a Personal account). Those never enter the
   * `discoverChannels`/`syncChannelSelection` picker — there is nothing
   * to pick — so they surface as a guided Reconnect notice instead.
   */
  accounts?: SocialAccount[];
}

export function ChannelsClient({
  channels,
  workspaceDomain,
  pageToAccountNanoid,
  verdicts = {},
  accounts = [],
}: Props) {
  const ws = workspaceDomain.toLowerCase();
  const { open: openConnectAccount, canConnect } = useConnectAccount();
  const [disconnectTarget, setDisconnectTarget] = useState<ManagedChannel | null>(
    null,
  );
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const router = useRouter();

  const activeCount = channels.filter((page) => page.is_active).length;

  // Page-less Door 2 (`instagram`) accounts with no synced channels: the
  // backend keeps the `SocialAccount` row but writes no `ManagedChannel`
  // (Personal account type, or a sync that produced nothing). There is no
  // picker for these — one account maps to one mirror channel — so guide the
  // user to switch to Business/Creator and Reconnect the same door.
  const instagramPendingAccounts = accounts.filter(
    (account) =>
      account.platform === "instagram" &&
      (account.managed_pages ?? []).length === 0,
  );

  // Syncs the whole *account*, not the row that was clicked, so one click
  // mints a fresh page token for every page of that login.
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

  const handleConfirmDisconnect = useCallback(async () => {
    if (!disconnectTarget) return;
    setDisconnecting(true);
    try {
      await disconnectChannelAction(disconnectTarget.nanoid, ws);
      router.refresh();
    } finally {
      setDisconnecting(false);
      setDisconnectTarget(null);
    }
  }, [disconnectTarget, ws, router]);

  const handleReconnect = useCallback(
    (platform: SocialPlatform) =>
      openConnectAccount({ preselectedPlatform: platform, rerequest: true }),
    [openConnectAccount],
  );

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-3xl border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold text-slate-900 text-xl">
              Connected Social Channels
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {activeCount} Active Channels
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Manage your connected social accounts. Posts created in the composer
            will automatically sync with your selected active channels.
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
          <p className="text-sm text-slate-500">
            No social channels connected yet.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((page) => (
            <ChannelCard
              key={page.nanoid}
              page={page}
              ws={ws}
              canConnect={canConnect}
              health={describeChannelHealth({
                verdict: page.is_active ? verdicts[page.nanoid] : undefined,
                tokenExpiresAt: page.token_expires_at,
                isActive: page.is_active,
              })}
              syncing={syncingId === page.nanoid}
              onSync={handleSync}
              onDisconnect={setDisconnectTarget}
              onReconnect={handleReconnect}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={disconnectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDisconnectTarget(null);
        }}
        title="Disconnect channel?"
        description="This channel will stop appearing in the composer and nothing will be published to it. Your Meta connection is not revoked and nothing is deleted — reconnect it at any time."
        confirmLabel={disconnecting ? "Disconnecting…" : "Disconnect"}
        variant="destructive"
        onConfirm={handleConfirmDisconnect}
        confirming={disconnecting}
      />
    </div>
  );
}
