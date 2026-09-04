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

/**
 * Normalize a media/API URL that Django baked an absolute origin into
 * (e.g. `http://127.0.0.1:8000/apis/media/assets/{nanoid}/stream/`) down
 * to a same-origin relative path.
 *
 * Rationale: the browser's session cookies live on the Next.js origin and
 * `/apis/*` is proxied to Django by `next.config.ts`. If the player hits the
 * absolute backend host directly (cross-origin), the session cookie is not
 * sent and the auth-backed `/stream/` endpoint returns 401. Rewriting to a
 * relative path routes the request through the same-origin proxy so cookies
 * attach and playback works, mirroring legacy Vite (`changeOrigin: false`).
 */
export function toSameOriginApiUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, "http://current.invalid");
    if (parsed.pathname.startsWith("/apis/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
    // Non-API (object-store/blob) URLs are left untouched.
    return url;
  } catch {
    // Already relative or malformed — pass through.
    return url.startsWith("/") ? url : null;
  }
}

export function toVideoView(asset: Asset): VideoView {
  const src = toSameOriginApiUrl(asset.stream_url || asset.original);
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
