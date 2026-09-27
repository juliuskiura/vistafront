import type { Asset } from "@/lib/api";
import type { VideoView } from "@/lib/apptypes/media_libary";

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
  if (!bytes && bytes !== 0) return "—";
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const formatVideoSize = formatFileSize;

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function generateColor(str: string): string {
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500",
    "bg-pink-500", "bg-primary-500", "bg-red-500", "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
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

export type { VideoView } from "@/lib/apptypes/media_libary";

/** Django-served path prefixes that the app host can reach on the same origin. */
const DJANGO_SERVED_PREFIXES = ["/apis/", "/media/", "/m/", "/d/"];

/**
 * Reduce a Django-served URL to a same-origin path.
 *
 * `stream_url` and friends are absolute URLs that Django builds from the Host it
 * saw on the request (`request.build_absolute_uri`, see
 * media_libary/serializers.py). That host is the app host whenever the browser
 * calls /apis/ same-origin, which is now the only way it calls it. But a value
 * that reached us another way -- a server-side render, or a row written when the
 * request came in on 127.0.0.1 -- can still carry a backend origin. Fetching
 * such a URL from the browser is cross-origin, so the httpOnly `access` cookie
 * is not attached and playback 401s.
 *
 * Dropping the origin and keeping path + query makes the browser resolve it
 * against the current page, which is exactly where nginx (or the Next.js
 * rewrite, in local dev) forwards it to Django.
 *
 * URLs outside the Django-served prefixes -- presigned object-storage links on
 * OCI, for instance -- are returned untouched. They are fetched by the storage
 * provider's own host, have no /media/ path to preserve, and must keep their
 * signature.
 */
export function toSameOrigin(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    // Relative inputs resolve against the placeholder and fall through as-is.
    const parsed = new URL(url, "http://relative.invalid");
    if (parsed.origin === "http://relative.invalid") return url;
    if (!DJANGO_SERVED_PREFIXES.some((p) => parsed.pathname.startsWith(p))) {
      return url;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export function toVideoView(asset: Asset): VideoView {
  const src = toSameOrigin(asset.stream_url) || toSameOrigin(asset.original_file) || null;
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
  return asset.asset_type === "video" && !!asset.original_file;
}
