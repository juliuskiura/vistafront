"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Unplug } from "@/lib/icons";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/social-icons";
import type { ConnectedInstagramResult, PostsSyncStatusResult } from "@/lib/api/types";
import { disableChannelAction } from "../../../actions";

export type SyncResult = NonNullable<PostsSyncStatusResult["result"]>;
export type InstagramResult = ConnectedInstagramResult;

interface ChannelActionsProps {
  syncResult: SyncResult | null;
  igResult: InstagramResult | null;
  workspaceDomain: string;
  channelId: string;
}

export function ChannelActions({
  syncResult,
  igResult,
  workspaceDomain,
  channelId,
}: ChannelActionsProps) {
  const ws = workspaceDomain.toLowerCase();
  const router = useRouter();
  const [disableOpen, setDisableOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisable = async () => {
    setDisabling(true);
    try {
      await disableChannelAction(channelId, ws);
      router.refresh();
    } finally {
      setDisabling(false);
    }
  };

  // Per-page disconnect: deactivates ONLY this channel row, leaving the
  // owning account and sibling channels untouched (same call as Disable —
  // the backend has no per-page revocation endpoint, so the distinction is
  // the destructive UX: Disconnect removes the page's access, Disable
  // merely pauses it).
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disableChannelAction(channelId, ws);
      router.push(`/${ws}/dashboard/socialmanager/channels`);
      router.refresh();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      {syncResult && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            <CheckCircle2 className="size-4 shrink-0" />
            <span className="font-semibold">Sync complete</span>
            <span>— {syncResult.created} new, {syncResult.skipped} skipped
              {syncResult.errors.length > 0 && `, ${syncResult.errors.length} failed`}.</span>
          </div>
          {syncResult.errors.map((err, i) => (
            <div key={i} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <span className="font-semibold">{err.page}</span>: {err.error}
            </div>
          ))}
        </div>
      )}

      {igResult && (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <SocialIcon name="instagram" className="size-4 text-pink-600" />
            <h3 className="text-sm font-semibold text-slate-900">Connected Instagram account</h3>
          </div>
          {igResult.connected && igResult.instagram_business_account ? (
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium text-neutral-700">Page ID:</span>{" "}
                <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{igResult.page_id}</code>
              </p>
              <p>
                <span className="font-medium text-neutral-700">IG Business Account ID:</span>{" "}
                <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
                  {igResult.instagram_business_account.id}
                </code>
              </p>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              No Instagram Business account connected to this page.
            </p>
          )}
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDisableOpen(true)}
          disabled={disabling}
          className="gap-2"
        >
          <Unplug className="size-4" />
          {disabling ? "Disabling…" : "Disable Channel"}
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDisconnectOpen(true)}
          disabled={disconnecting}
          className="gap-2"
        >
          <Unplug className="size-4" />
          {disconnecting ? "Disconnecting…" : "Disconnect"}
        </Button>
      </div>

      <ConfirmDialog
        open={disableOpen}
        onOpenChange={setDisableOpen}
        title="Disable channel?"
        description="This channel will stop appearing in the composer and nothing will be published to it. Your platform connection is not revoked and nothing is deleted — re-enable it at any time."
        confirmLabel={disabling ? "Disabling…" : "Disable"}
        variant="default"
        onConfirm={handleDisable}
        confirming={disabling}
      />

      <ConfirmDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        title="Disconnect channel?"
        description={
          <ul className="list-disc space-y-1.5 pl-5 text-left">
            <li>
              This page loses access — it stops appearing in the composer and
              nothing will be published to it.
            </li>
            <li>Other pages on the same account stay connected.</li>
            <li>Posts already published on the platform are not deleted.</li>
            <li>
              This channel&apos;s saved data is permanently deleted within 14
              days — and if it is the account&apos;s last channel, the account
              connection is removed as well.
            </li>
            <li>This cannot be undone — reconnect to use it again.</li>
          </ul>
        }
        confirmLabel={disconnecting ? "Disconnecting…" : "Disconnect"}
        variant="destructive"
        size="md"
        onConfirm={handleDisconnect}
        confirming={disconnecting}
      />
    </>
  );
}