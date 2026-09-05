"use client";

import { Card } from "@/components/ui/card";
import { formatTime, formatVideoSize } from "@/lib/media/video-utils";
import type { Asset } from "@/lib/api";

interface VideoSpecsPanelProps {
  asset: Asset;
  compact?: boolean;
}

export default function VideoSpecsPanel({
  asset,
  compact = false,
}: VideoSpecsPanelProps) {
  const ext = asset.extension?.replace(".", "").toUpperCase() || "—";
  const dims = asset.width && asset.height ? `${asset.width} × ${asset.height}` : "—";

  const rows: { label: string; value: string }[] = [
    { label: "Container", value: ext },
    { label: "Dimensions", value: dims },
    { label: "Duration", value: asset.duration_seconds != null ? formatTime(asset.duration_seconds, asset.duration_seconds >= 3600) : "—" },
    { label: "File size", value: formatVideoSize(asset.size) },
    { label: "Frame rate", value: "—" },
    { label: "Video codec", value: "—" },
    { label: "Audio codec", value: "—" },
    { label: "Bitrate", value: "—" },
    { label: "MIME type", value: asset.mime_type || "—" },
  ];

  return (
    <Card className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Video specifications</h3>
        {!compact && <span className="text-xs text-muted-foreground font-mono">{ext}</span>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{r.label}</p>
            <p className="font-mono text-sm text-foreground break-all">{r.value}</p>
          </div>
        ))}
      </div>
      {!compact && (
        <p className="mt-4 text-[11px] text-muted-foreground">Frame rate, codec and bitrate are not extracted by the server, so they show as — rather than guessed values.</p>
      )}
    </Card>
  );
}
