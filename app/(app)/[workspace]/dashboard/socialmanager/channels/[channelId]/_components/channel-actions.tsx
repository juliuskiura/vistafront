"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Unplug } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/social-icons";
import type { ConnectedInstagramResult, PostsSyncStatusResult } from "@/lib/api/types";
import { disconnectChannelAction } from "../../../actions";

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
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await disconnectChannelAction(channelId, ws);
      router.refresh();
    } finally {
      setRevoking(false);
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

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setDisconnectOpen(true)}
        disabled={revoking}
        className="gap-2"
      >
        <Unplug className="size-4" />
        {revoking ? "Disconnecting…" : "Disconnect Channel"}
      </Button>

      <ConfirmDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        title="Disconnect channel?"
        description="This will revoke access to this channel and remove it from your connected channels. Posts already published will not be deleted."
        confirmLabel={revoking ? "Disconnecting…" : "Disconnect"}
        variant="destructive"
        onConfirm={handleRevoke}
        confirming={revoking}
      />
    </>
  );
}