import type { NoteTypeOption } from "@/lib/api";

/**
 * Resolves a note type's backend-supplied `color_code` into a CSS custom
 * property that `.nb-accent` consumes for the card's left rule.
 *
 * Two safety properties, both load-bearing:
 *
 * 1. **No class-name injection.** `color_code` holds Tailwind class strings
 *    authored by a workspace admin and stored in Django. They are matched
 *    against the palette below; anything unrecognised falls back to the
 *    default rather than being passed through into `className`. Interpolating
 *    an arbitrary string from the database into rendered markup is the kind
 *    of hole that turns into a stored-XSS the day someone widens the input.
 *
 * 2. **Real colours, not generated ones.** Tailwind v4 only emits classes it
 *    finds by scanning source. A class assembled at runtime
 *    (`bg-${hue}-500`) would not exist in the stylesheet and would silently
 *    paint nothing. So the palette is a literal record, and the dot colour is
 *    written as an inline `style` (a plain CSS hex), which needs no
 *    generation and cannot be purged.
 */

const TONE_DOTS: Record<string, string> = {
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  slate: "#64748b",
  zinc: "#71717a",
  neutral: "#737373",
  stone: "#78716c",
};

export const DEFAULT_TONE = "slate";

function toneFromClass(className: string | undefined | null): string | null {
  if (!className) return null;
  // `bg-emerald-500`, `text-emerald-700`, `bg-emerald-500/20` → `emerald`.
  const match = /(?:bg|text|border)-([a-z]+)-\d{2,3}/i.exec(className);
  if (!match) return null;
  const tone = match[1].toLowerCase();
  return tone in TONE_DOTS ? tone : null;
}

/** The CSS colour for a note type's accent rule. */
export function toneColor(tone: string): string {
  return TONE_DOTS[tone] ?? TONE_DOTS[DEFAULT_TONE];
}

/**
 * Tailwind classes for the type pill, derived from the resolved tone so the
 * chip always matches the card's accent rule. Returns classes that are
 * written literally here, so Tailwind emits them.
 */
export function toneChipClasses(tone: string): string {
  switch (tone) {
    case "emerald": return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "teal": return "bg-teal-500/10 text-teal-700 dark:text-teal-300";
    case "cyan": return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
    case "sky": return "bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "blue": return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
    case "indigo": return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300";
    case "violet": return "bg-violet-500/10 text-violet-700 dark:text-violet-300";
    case "purple": return "bg-purple-500/10 text-purple-700 dark:text-purple-300";
    case "fuchsia": return "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300";
    case "pink": return "bg-pink-500/10 text-pink-700 dark:text-pink-300";
    case "rose": return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
    case "red": return "bg-red-500/10 text-red-700 dark:text-red-300";
    case "orange": return "bg-orange-500/10 text-orange-700 dark:text-orange-300";
    case "amber": return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "yellow": return "bg-yellow-500/10 text-yellow-900 dark:text-yellow-200";
    case "lime": return "bg-lime-500/10 text-lime-700 dark:text-lime-300";
    case "green": return "bg-green-500/10 text-green-700 dark:text-green-300";
    default: return "bg-slate-500/10 text-slate-700 dark:text-slate-300";
  }
}

/** Resolve the tone for a note type, preferring its own `color_code`. */
export function resolveTone(type?: NoteTypeOption | null): string {
  return (
    toneFromClass(type?.color_code?.bg) ??
    toneFromClass(type?.color_code?.text) ??
    DEFAULT_TONE
  );
}

interface TypeSwatchProps {
  type?: NoteTypeOption | null;
  /** Fallback label when the type is unknown (deleted, or not in the list). */
  fallback: string;
  /** `pill` for a filled chip, `dot` for the bare accent marker. */
  variant?: "pill" | "dot";
  className?: string;
}

/**
 * A note type rendered as a tinted chip or a bare accent dot.
 *
 * This is the one place `color_code` from the backend reaches the DOM, and
 * it reaches it as a validated tone rather than a raw class string.
 */
export function TypeSwatch({
  type,
  fallback,
  variant = "pill",
  className,
}: TypeSwatchProps) {
  const tone = resolveTone(type);
  const label = type?.name ?? fallback;

  if (variant === "dot") {
    return (
      <span
        aria-hidden="true"
        className={`inline-block size-2 shrink-0 rounded-full ${className ?? ""}`}
        style={{ backgroundColor: toneColor(tone) }}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5 ${toneChipClasses(tone)} ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className="inline-block size-1.5 rounded-full"
        style={{ backgroundColor: toneColor(tone) }}
      />
      {label}
    </span>
  );
}
