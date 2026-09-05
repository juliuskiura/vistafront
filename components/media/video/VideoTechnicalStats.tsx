"use client";

import React from "react";
import { Activity, X } from "lucide-react";
import { formatBitrate, formatVideoSize, containerFromExtension } from "@/lib/media/video-utils";
import { isHlsAsset } from "@/lib/media/hls";
import type { Asset } from "@/lib/api";
import type { VideoPlayerState } from "@/lib/apptypes/media_libary";

interface VideoTechnicalStatsProps {
  asset: Asset;
  playerState: VideoPlayerState;
  fps?: number | null;
  onClose: () => void;
}

export const VideoTechnicalStats: React.FC<VideoTechnicalStatsProps> = ({
  asset,
  playerState,
  fps = null,
  onClose,
}) => {
const isHls = isHlsAsset(asset)
  const container = asset.extension?.toUpperCase() || "—";
  const dims = asset.width && asset.height ? `${asset.width} × ${asset.height}` : "—";

  const stats = [
    { label: "Stream Type", value: isHls ? "HLS ADAPTIVE (.m3u8)" : "PROGRESSIVE" },
    { label: "Container", value: container },
    { label: "Dimensions", value: dims },
    { label: "Frame Rate", value: fps != null ? `${fps} fps` : "—" },
    { label: "Video Codec", value: "—" },
    { label: "Audio Codec", value: "—" },
    { label: "Bitrate", value: formatBitrate(null) },
    { label: "File Size", value: formatVideoSize(asset.size ?? null) },
    { label: "Playback Speed", value: `${playerState.playbackRate}x` },
    { label: "Buffer Horizon", value: `${Math.max(0, playerState.bufferedEnd - playerState.currentTime).toFixed(2)}s` },
    { label: "Audio Gain", value: playerState.isMuted ? "0% (Muted)" : `${Math.round(playerState.volume * 100)}%` },
  ];

  return (
    <div className="absolute top-5 left-5 z-40 w-76 max-w-[90vw] rounded border border-border bg-popover/95 p-3.5 text-foreground shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-primary" /><span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Diagnostics</span></div>
        <button onClick={onClose} className="rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label="Close diagnostics"><X className="h-3 w-3" /></button>
      </div>
      <div className="mt-2.5 space-y-1 font-mono text-[10px]">
        {stats.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-2">
            <span className="text-muted-foreground uppercase tracking-wider shrink-0">{item.label}:</span>
            <span className="text-right font-medium text-foreground truncate">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
