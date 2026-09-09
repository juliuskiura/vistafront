import { AlertCircle, Lock, RefreshCw, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDate, tokenProgress, type TokenHealth } from "./platform-gradients";

interface ChannelHealthProps {
  token: TokenHealth;
  lastSynced: string | null;
}

export function ChannelHealth({ token, lastSynced }: ChannelHealthProps) {
  const { status, days } = token;
  const value = tokenProgress(days);

  const statusLine =
    status === "active" ? (
      <span className="flex items-center gap-1 font-medium text-emerald-600">
        <ShieldCheck className="size-3.5" />
        {days !== null ? `Active (${days}d left)` : "Active"}
      </span>
    ) : status === "expiring_soon" ? (
      <span className="flex items-center gap-1 font-bold text-amber-600">
        <AlertCircle className="size-3.5" />
        Expires in {days}d
      </span>
    ) : (
      <span className="flex items-center gap-1 font-medium text-rose-600">
        <Lock className="size-3.5" />
        Token Expired
      </span>
    );

  return (
    <Card className="space-y-3 p-4 text-xs">
      <div className="flex items-center justify-between gap-3 text-slate-600">
        <span className="font-medium text-slate-900">Token Health</span>
        <span className="flex items-center gap-1">{statusLine}</span>
      </div>
      <Progress
        value={value}
        className={cn(
          "h-1.5",
          status === "active" && "[&>div]:bg-emerald-500",
          status === "expiring_soon" && "[&>div]:bg-amber-500",
          status === "expired" && "[&>div]:bg-rose-500",
        )}
      />
      {lastSynced && (
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1">
            <RefreshCw className="size-3" />
            Last Synced:
          </span>
          <span>{formatDate(lastSynced)}</span>
        </div>
      )}
    </Card>
  );
}