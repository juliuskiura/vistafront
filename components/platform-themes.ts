export const PLATFORM_THEMES: Record<string, { bg: string; border: string; badge: string }> = {
  facebook: { bg: "bg-indigo-50", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700" },
  instagram: { bg: "bg-pink-50", border: "border-pink-200", badge: "bg-pink-100 text-pink-700" },
  x: { bg: "bg-sky-50", border: "border-sky-200", badge: "bg-sky-100 text-sky-700" },
  linkedin: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" },
  tiktok: { bg: "bg-slate-100", border: "border-slate-300", badge: "bg-slate-200 text-slate-800" },
  youtube: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700" },
  pinterest: { bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-100 text-rose-700" },
  threads: { bg: "bg-zinc-100", border: "border-zinc-300", badge: "bg-zinc-200 text-zinc-800" },
};

export function getPlatformTheme(slug: string) {
  return (
    PLATFORM_THEMES[slug] || {
      bg: "bg-slate-50",
      border: "border-slate-200",
      badge: "bg-slate-100 text-slate-700",
    }
  );
}
