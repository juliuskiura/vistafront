export type TokenStatus = "active" | "expiring_soon" | "expired";

export interface TokenHealth {
  status: TokenStatus;
  days: number | null;
}

export const PLATFORM_GRADIENTS: Record<string, string> = {
  instagram: "from-pink-500 to-rose-500",
  facebook: "from-indigo-500 to-blue-500",
  x: "from-slate-700 to-slate-900",
  linkedin: "from-blue-600 to-blue-800",
  tiktok: "from-slate-800 to-zinc-950",
  youtube: "from-red-500 to-red-700",
  pinterest: "from-rose-500 to-red-600",
  threads: "from-zinc-700 to-zinc-900",
  bluesky: "from-sky-500 to-sky-700",
  mastodon: "from-purple-600 to-fuchsia-700",
  google_business: "from-amber-500 to-orange-600",
  start_page: "from-emerald-500 to-teal-600",
};

const TOKEN_WINDOW_DAYS = 60;

export const STATUS_STYLES: Record<string, string> = {
  scheduled: "text-violet-700 bg-violet-50 border-violet-200",
  published: "text-emerald-700 bg-emerald-50 border-emerald-200",
  draft: "text-amber-700 bg-amber-50 border-amber-200",
  publishing: "text-sky-700 bg-sky-50 border-sky-200",
  failed: "text-red-700 bg-red-50 border-red-200",
  canceled: "text-slate-600 bg-slate-50 border-slate-200",
};

export const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  scheduled: { label: "Scheduled", badge: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  published: { label: "Published", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  draft: { label: "Draft", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  publishing: { label: "Publishing", badge: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  failed: { label: "Failed", badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  canceled: { label: "Canceled", badge: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

export function getPlatformGradient(platform: string): string {
  return PLATFORM_GRADIENTS[platform] ?? "from-indigo-600 to-purple-600";
}

export function getTokenHealth(expiresAt: string | null): TokenHealth {
  if (!expiresAt) return { status: "active", days: null };
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const days = Math.floor((expiry - now) / 86400000);
  if (expiry <= now) return { status: "expired", days: 0 };
  if (days <= 14) return { status: "expiring_soon", days };
  return { status: "active", days };
}

export function tokenProgress(days: number | null): number {
  if (days === null) return 100;
  return Math.min(100, Math.max(0, (days / TOKEN_WINDOW_DAYS) * 100));
}

export function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}