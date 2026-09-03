import { SocialIcon, hasSocialIcon } from "@/components/social-icons";

/**
 * Per-platform badge styles shared across the social manager UI, matching
 * the original frontapp palettes.
 */
export const PLATFORM_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  instagram: { label: "Instagram", color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  facebook: { label: "Facebook", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  x: { label: "X", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
  linkedin: { label: "LinkedIn", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  tiktok: { label: "TikTok", color: "text-slate-900", bg: "bg-slate-100", border: "border-slate-300" },
  youtube: { label: "YouTube", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  pinterest: { label: "Pinterest", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  threads: { label: "Threads", color: "text-zinc-900", bg: "bg-zinc-100", border: "border-zinc-300" },
  bluesky: { label: "Bluesky", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" },
  mastodon: { label: "Mastodon", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  google_business: { label: "Google Business", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  start_page: { label: "Start Page", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
};

export function getPlatformStyle(slug: string): { label: string; color: string; bg: string; border: string } {
  return (
    PLATFORM_STYLES[slug] ?? {
      label: slug,
      color: "text-neutral-600",
      bg: "bg-neutral-100",
      border: "border-neutral-200",
    }
  );
}

/**
 * Renders a platform's glyph: the real brand icon when available, otherwise a
 * compact text badge (e.g. "IG", "FB", "LI"). Mirrors the original frontapp
 * ChannelsPage/ChannelDetailPage behaviour.
 */
export function PlatformGlyph({
  platform,
  size,
  className,
  fallbackIcon,
}: {
  platform?: string;
  size: "sm" | "md" | "lg";
  className?: string;
  fallbackIcon?: string;
}) {
  const raw = platform || "";
  const style = getPlatformStyle(raw);
  const dims =
    size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (hasSocialIcon(raw)) {
    return <SocialIcon name={raw} className={`${dims} ${style.color} ${className ?? ""}`} />;
  }

  const fallback = fallbackIcon || (raw ? raw.slice(0, 2).toUpperCase() : "?");
  return (
    <span
      className={`${dims} flex items-center justify-center rounded-md border text-[9px] font-bold ${style.bg} ${style.color} ${style.border} ${className ?? ""}`}
    >
      {fallback}
    </span>
  );
}
