"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useToast } from "@/lib/context";
import { useGetAssetMetasQuery, usePatchAssetMutation, useCreateAssetMetaMutation, useUpdateAssetMetaMutation } from "@/hooks/useMedia";
import { VideoPlayer } from "./VideoPlayer";
import VideoSpecsPanel from "./VideoSpecsPanel";
import { readMarkers, findMarkersMeta, VIDEO_MARKERS_KEY } from "@/lib/media/video-markers";
import type { VideoCuePoint } from "@/lib/apptypes/media_libary";
import type { AssetMeta, Asset } from "@/lib/api";

interface VideoStudioProps {
  asset: Asset;
  workspaceDomain: string;
}

export function VideoStudio({
  asset,
  workspaceDomain,
}: VideoStudioProps) {
  const toast = useToast();
  const backfilledRef = useRef(false);
  const [metas, setMetas] = useState<AssetMeta[]>([]);
  const [cuePoints, setCuePoints] = useState<VideoCuePoint[]>([]);

  const { data: metasData } = useGetAssetMetasQuery(asset.nanoid, workspaceDomain);
  const patchAssetMutation = usePatchAssetMutation(workspaceDomain);
  const createAssetMetaMutation = useCreateAssetMetaMutation(workspaceDomain);
  const updateAssetMetaMutation = useUpdateAssetMetaMutation(workspaceDomain);

  useEffect(() => {
    if (metasData) {
      setMetas(metasData);
      setCuePoints(readMarkers(metasData));
    }
  }, [metasData]);

  const handleLoadedMetadata = useCallback((info: { duration: number; width: number; height: number }) => {
    if (backfilledRef.current) return;
    if (asset.duration_seconds == null || asset.width == null || asset.height == null) {
      backfilledRef.current = true;
      patchAssetMutation.mutate({
        nanoid: asset.nanoid,
        data: {
          duration_seconds: Math.round(info.duration * 1000) / 1000,
          width: info.width,
          height: info.height,
        },
      });
    }
  }, [asset, patchAssetMutation]);

  const handleAddCuePoint = useCallback(async (cue: VideoCuePoint) => {
    const next = [...cuePoints, cue];
    try {
      const markersMeta = findMarkersMeta(metas);
      if (markersMeta) {
        await updateAssetMetaMutation.mutateAsync({ nanoid: markersMeta.nanoid, data: { value: JSON.stringify(next) } });
      } else {
        await createAssetMetaMutation.mutateAsync({ asset: asset.nanoid, key: VIDEO_MARKERS_KEY, value: JSON.stringify(next) });
      }
      setCuePoints(next);
      toast.push({ title: "Marker added", message: `Marker at ${Math.floor(cue.time / 60)}:${String(Math.floor(cue.time % 60)).padStart(2, "0")}`, variant: "success" });
    } catch {
      toast.push({ title: "Could not save marker", message: "Failed to persist marker to server.", variant: "error" });
    }
  }, [cuePoints, metas, asset, toast, createAssetMetaMutation, updateAssetMetaMutation]);

  const handleSourceExpired = useCallback(() => {
    // Source re-initialization relies on useEffect dependencies on asset.original_file and asset.stream_url
  }, []);

  return (
    <div className="space-y-4">
      <VideoPlayer
        asset={asset}
        cuePoints={cuePoints}
        onCuePointAdd={handleAddCuePoint}
        onLoadedMetadata={handleLoadedMetadata}
        onSourceExpired={handleSourceExpired}
      />
      <VideoSpecsPanel asset={asset} compact />
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
