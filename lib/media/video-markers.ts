import type { VideoCuePoint } from "@/lib/apptypes/media_libary";
import type { AssetMeta } from "@/lib/api";

export const VIDEO_MARKERS_KEY = "video.markers";

export function isCuePoint(v: any): v is VideoCuePoint {
  return v && typeof v.id === "string" && typeof v.time === "number" && typeof v.title === "string" && (v.type === "marker" || v.type === "note" || v.type === "chapter");
}

export function readMarkers(metas: AssetMeta[] | undefined): VideoCuePoint[] {
  if (!metas || metas.length === 0) return [];
  const markersMeta = metas.find((m) => m.key === VIDEO_MARKERS_KEY);
  if (!markersMeta?.value) return [];
  try {
    const parsed = JSON.parse(markersMeta.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCuePoint);
  } catch (e) {
    console.warn('Failed to parse video.markers meta; ignoring.', e);
    return [];
  }
}

export function findMarkersMeta(metas: AssetMeta[] | undefined): AssetMeta | undefined {
  return metas?.find((m) => m.key === VIDEO_MARKERS_KEY);
}
