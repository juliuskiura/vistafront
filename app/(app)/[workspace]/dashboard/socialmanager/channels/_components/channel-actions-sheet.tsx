"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RefreshCw, ShieldAlert, Unplug, X, Settings } from "@/lib/icons";
import type { ManagedChannel, SocialPlatform } from "@/lib/api/types";
import { VSButton } from "@/components/shared/components/customUi/VSButton";

interface ChannelActionsSheetProps {
  page: ManagedChannel;
  ws: string;
  canConnect: boolean;
  onSync: (page: ManagedChannel) => void;
  onDisable: (page: ManagedChannel) => void;
  onDisconnect: (page: ManagedChannel) => void;
  onReconnect: (platform: SocialPlatform) => void;
}

export function ChannelActionsSheet({
  page,
  ws,
  canConnect,
  onSync,
  onDisable,
  onDisconnect,
  onReconnect,
}: ChannelActionsSheetProps) {
  const [syncing, setSyncing] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync(page);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisable = async () => {
    setDisabling(true);
    try {
      await onDisable(page);
    } finally {
      setDisabling(false);
    }
  };

  return (
    <SheetContent side="right" className="sm:max-w-md p-0">
      <SheetHeader className="p-5 pb-4 flex items-center justify-between border-b border-sidebar-divider">
        <div className="flex items-center gap-3 min-w-0 flex-1">

          <SheetTitle className="text-lg font-semibold text-slate-900 truncate">
            {page.page_name || "Untitled Channel"}
          </SheetTitle>
        </div>

      </SheetHeader>

      <div className="p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Actions</h3>
          <p className="text-xs text-slate-600">Manage this channel&apos;s connection</p>
        </div>

        <Button
          onClick={handleSync}
          disabled={syncing || !canConnect}
          className="w-full justify-start gap-3 h-14 p-4"
          variant="outline"
        >
          <div className="bg-slate-50 p-2 rounded-lg shrink-0">
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""} text-slate-600`} />
          </div>
          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="font-medium text-sm truncate">Sync Audience</span>
            <span className="text-xs text-slate-500 truncate">
              Refresh token
            </span>
          </div>
        </Button>

        <Button
          onClick={handleDisable}
          disabled={disabling || !canConnect}
          className="w-full justify-start gap-3 p-4 h-auto"
          variant="secondary"
        >
          <div className="p-2 rounded-lg shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>

          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="font-medium text-sm">
              Disable
            </span>

            <span className="text-xs whitespace-normal break-words text-left">
              Keep the connection, but SocialManager temporarily stops using it
            </span>
          </div>
        </Button>

        <Button
          onClick={() => onDisconnect(page)}
          disabled={!canConnect}
          className="w-full justify-start gap-3 p-4 h-auto"
          variant="destructive"
        >
          <div className="p-2 rounded-lg shrink-0">
            <Unplug className="w-4 h-4" />
          </div>

          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="font-medium text-sm">
              Disconnect
            </span>

            <span className="text-xs whitespace-normal break-words text-left opacity-90">
              Remove this page's access — other pages on the same account stay connected.
            </span>
          </div>
        </Button>

      </div>
    </SheetContent>
  );
}