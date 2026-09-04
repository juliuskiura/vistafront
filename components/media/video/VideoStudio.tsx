"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useToast } from "@/lib/context";
import { getAsset } from "@/lib/api";
import {
  updateAssetAction,
  getAssetMetasAction,
  createAssetMetaAction,
  updateAssetMetaAction,
} from "@/app/(app)/[workspace]/dashboard/media/actions";
import { VideoPlayer } from "./VideoPlayer";
import VideoSpecsPanel from "./VideoSpecsPanel";
import { readMarkers, findMarkersMeta, VIDEO_MARKERS_KEY } from "@/lib/media/video-markers";
import type { VideoCuePoint } from "@/lib/media/video-markers";
import type { AssetMeta } from "@/lib/api";

interface VideoStudioProps {
  assetType: string;
  mimeType: string;
  extension: string;
  size: number | null;
  src: string | null;
  thumbnail: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  nanoid: string;
  workspaceDomain: string;
  asset?: import("@/lib/api").Asset;
}

export function VideoStudio({
  assetType,
  mimeType,
  extension,
  size,
  src,
  thumbnail,
  durationSeconds,
  width,
  height,
  fps = null,
  nanoid,
  workspaceDomain,
  asset,
}: VideoStudioProps) {
  const toast = useToast();
  const backfilledRef = useRef(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const sourceRefreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [metas, setMetas] = useState<AssetMeta[]>([]);
  const [cuePoints, setCuePoints] = useState<VideoCuePoint[]>([]);

  // Fetch metas on mount
  useEffect(() => {
    let cancelled = false;
    getAssetMetasAction(nanoid, workspaceDomain)
      .then((m) => {
        if (!cancelled) {
          setMetas(m);
          setCuePoints(readMarkers(m));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [nanoid, workspaceDomain]);

  const handleLoadedMetadata = useCallback((info: { duration: number; width: number; height: number }) => {
    if (backfilledRef.current) return;
    if (durationSeconds == null || width == null || height == null) {
      backfilledRef.current = true;
      updateAssetAction(nanoid, {
        duration_seconds: Math.round(info.duration * 1000) / 1000,
        width: info.width,
        height: info.height,
      }, workspaceDomain).catch(() => {});
    }
  }, [durationSeconds, width, height, nanoid, workspaceDomain]);

  const handleAddCuePoint = useCallback(async (cue: VideoCuePoint) => {
    const next = [...cuePoints, cue];
    try {
      const markersMeta = findMarkersMeta(metas);
      if (markersMeta) {
        await updateAssetMetaAction(markersMeta.nanoid, nanoid, { value: JSON.stringify(next) }, workspaceDomain);
      } else {
        await createAssetMetaAction({ asset: nanoid, key: VIDEO_MARKERS_KEY, value: JSON.stringify(next) }, workspaceDomain);
      }
      setCuePoints(next);
      toast.push({ title: "Marker added", message: `Marker at ${Math.floor(cue.time / 60)}:${String(Math.floor(cue.time % 60)).padStart(2, "0")}`, variant: "success" });
    } catch {
      toast.push({ title: "Could not save marker", message: "Failed to persist marker to server.", variant: "error" });
    }
  }, [cuePoints, metas, nanoid, workspaceDomain, toast]);

  // Refresh presigned source URL periodically to handle expiry
  useEffect(() => {
    sourceRefreshTimer.current = setInterval(async () => {
      try {
        const updated = await getAsset(nanoid, workspaceDomain);
        if (updated.stream_url && updated.stream_url !== currentSrc) {
          setCurrentSrc(updated.stream_url);
        }
      } catch {}
    }, 60000);
    return () => { if (sourceRefreshTimer.current) clearInterval(sourceRefreshTimer.current); };
  }, [nanoid, workspaceDomain, currentSrc]);

  return (
    <div className="space-y-4">
      <VideoPlayer
        src={currentSrc}
        assetType={assetType}
        mimeType={mimeType}
        thumbnail={thumbnail}
        durationSeconds={durationSeconds}
        width={width}
        height={height}
        fps={fps}
        onLoadedMetadata={handleLoadedMetadata}
        onSourceExpired={async () => {
          try {
            const updated = await getAsset(nanoid, workspaceDomain);
            if (updated.stream_url) setCurrentSrc(updated.stream_url);
          } catch {}
        }}
        asset={asset}
      />
      <VideoSpecsPanel
        assetType={assetType}
        mimeType={mimeType}
        extension={extension}
        size={size}
        durationSeconds={durationSeconds}
        width={width}
        height={height}
        compact
      />
      {cuePoints.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Markers</h4>
          <ul className="space-y-1.5">
            {cuePoints
              .slice()
              .sort((a, b) => a.time - b.time)
              .map((cp) => (
                <li key={cp.id} className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">
                    {Math.floor(cp.time / 60)}:{String(Math.floor(cp.time % 60)).padStart(2, "0")}
                  </span>
                  <span className="truncate text-foreground">{cp.title}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
