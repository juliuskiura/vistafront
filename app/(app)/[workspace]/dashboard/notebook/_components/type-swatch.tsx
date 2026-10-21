import type { NoteTypeOption } from "@/lib/api";

/**
 * Resolves a note type's accent colour from its backend-supplied `color_code`.
 *
 * Returns `bg` as the chip fill colour. Values are plain CSS hex strings
 * (`#e5e7eb`) — they are written inline as `style` attributes, never
 * interpolated into `className`, so there is no class-name injection surface
 * from the database.
 */

export const DEFAULT_HEX = "#64748b";

/** The CSS colour for a note type's accent rule (the chip / dot fill). */
export function resolveTypeBgColor(type?: NoteTypeOption | null): string {
  return type?.color_code?.bg ?? DEFAULT_HEX;
}

/** Backward-compatible alias for `resolveTypeBgColor`. */
export const resolveTypeColor = resolveTypeBgColor;

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
 * Colours come straight from `color_code` (`bg` for the chip fill, `text`
 * for the dot / text), rendered as inline CSS colour values.
 */
export function TypeSwatch({
  type,
  fallback,
  variant = "dot",
  className,
}: TypeSwatchProps) {
  const bg = type?.color_code?.bg ?? DEFAULT_HEX;
  const text = type?.color_code?.text ?? "#000000";
  const label = type?.name ?? fallback;

  if (variant === "dot") {
    return (
      <span
        aria-hidden="true"
        className={`inline-block size-2 shrink-0 rounded-full ${className ?? ""}`}
        style={{ backgroundColor: bg }}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5 ${className ?? ""}`}
      style={{ backgroundColor: bg, color: text }}
    >
      <span
        aria-hidden="true"
        className="inline-block size-1.5 rounded-full"
        style={{ backgroundColor: text }}
      />
      {label}
    </span>
  );
}
