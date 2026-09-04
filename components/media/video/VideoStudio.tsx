"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useToast } from "@/lib/context";
import { useQuery } from "@tanstack/react-query";
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
import type { AssetMeta, Asset } from "@/lib/api";

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

/**
 * Fetch the current asset (fresh presigned `stream_url`) through the Next
 * Route Handler so the client gets server-side cookie/`X-Workspace`
 * forwarding. TanStack Query manages the polling every 60s; the returned
 * data object is always fresh so the player can re-initialize.
 */
async function fetchAsset(nanoid: string, workspaceDomain: string): Promise<Asset> {
  const res = await fetch(
    `/api/media/asset?nanoid=${encodeURIComponent(nanoid)}&workspace=${encodeURIComponent(workspaceDomain)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Failed to fetch asset");
  return res.json();
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
  const [metas, setMetas] = useState<AssetMeta[]>([]);
  const [cuePoints, setCuePoints] = useState<VideoCuePoint[]>([]);
  // Forced re-init counter: bumped only when the source actually expires
  // (player fires an error), so the <video> re-attaches even when the URL
  // string is unchanged. Mirrors legacy RTK `refetch()` which always
  // re-ran the player init effect.
  const [expiryRemountKey, setExpiryRemountKey] = useState(0);

  // Live asset data: poll for a fresh presigned URL while the user lingers.
  const { data: liveAsset, refetch } = useQuery({
    queryKey: ["asset", "video-studio", nanoid, workspaceDomain],
    queryFn: () => fetchAsset(nanoid, workspaceDomain),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const currentSrc = liveAsset?.stream_url ?? src;

  const handleSourceExpired = useCallback(() => {
    setExpiryRemountKey((k) => k + 1);
    refetch();
  }, [refetch]);

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

  return (
    <div className="space-y-4">
      <VideoPlayer
        key={expiryRemountKey}
        src={currentSrc}
        assetType={assetType}
        mimeType={mimeType}
        thumbnail={thumbnail}
        durationSeconds={durationSeconds}
        width={width}
        height={height}
        fps={fps}
        onLoadedMetadata={handleLoadedMetadata}
        onSourceExpired={handleSourceExpired}
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
