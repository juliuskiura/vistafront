import type { Asset } from "@/lib/api";

export function formatTime(seconds: number, includeHours: boolean = false): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0 || includeHours) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatTimecode(seconds: number, fps: number | null = null): string {
  if (isNaN(seconds) || seconds < 0) return "00:00:00.000";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (fps == null) {
    const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  }
  const f = Math.floor((seconds % 1) * fps);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`;
}

/** Parses time strings like "1:24", "01:24", "1:05:30", "75", "1m 15s" into seconds. */
export function parseTimeString(input: string, fps: number | null = null): number | null {
  const clean = input.trim().toLowerCase();
  if (!clean) return null;

  if (/^\d+(\.\d+)?$/.test(clean)) {
    return Math.max(0, parseFloat(clean));
  }

  const parts = clean.split(":").map((p) => parseFloat(p));
  if (parts.some((p) => isNaN(p))) return null;

  if (parts.length === 4) {
    const [h, m, s, f] = parts;
    return h * 3600 + m * 60 + s + (fps ? f / fps : 0);
  } else if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }

  return null;
}

export function formatBitrate(bps: number | null): string {
  if (bps == null || bps <= 0) return "—";
  if (bps >= 1000000) return `${(bps / 1000000).toFixed(1)} Mbps`;
  return `${Math.round(bps / 1000)} kbps`;
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function containerFromExtension(asset: Asset): string | null {
  const ext = asset.extension?.toLowerCase().replace(".", "") || "";
  if (!ext) return null;
  const map: Record<string, string> = {
    webm: "WebM", mp4: "MP4", m4v: "MP4", mov: "QuickTime",
    mkv: "Matroska", avi: "AVI", flv: "Flash", wmv: "WMV",
  };
  return map[ext] || ext.toUpperCase();
}

export interface VideoView {
  src: string | null;
  poster: string | null;
  name: string;
  sizeBytes: number | null;
  mimeType: string;
  extension: string | undefined;
  container: string | null;
  durationHint: number | null;
  widthHint: number | null;
  heightHint: number | null;
  fps: number | null;
  codec: string | null;
  codecAudio: string | null;
  bitrate: number | null;
}

export function toVideoView(asset: Asset): VideoView {
  const src = asset.stream_url || asset.original || null;
  return {
    src,
    poster: asset.thumbnail || null,
    name: asset.name,
    sizeBytes: asset.size ?? null,
    mimeType: asset.mime_type,
    extension: asset.extension,
    container: containerFromExtension(asset),
    durationHint: asset.duration_seconds ?? null,
    widthHint: asset.width ?? null,
    heightHint: asset.height ?? null,
    fps: null,
    codec: null,
    codecAudio: null,
    bitrate: null,
  };
}

export function isPlayableVideo(asset: Asset): boolean {
  return asset.asset_type === "video" && !!asset.original;
}
