"use client";

import { Eraser } from "@/lib/icons";
import { cn } from "@/lib/utils";

import {
  HIGHLIGHT_COLORS,
  TEXT_COLORS,
} from "./editor-color-swatches";

export { HIGHLIGHT_COLORS, TEXT_COLORS };

/**
 * A labelled row of colour swatches.
 *
 * A fixed palette cannot answer "make this line the colour of the logo", so
 * both pickers pair the grid with a native colour input below it.
 */
export function SwatchGrid({
  colors,
  active,
  onSelect,
}: {
  colors: string[];
  active: string | null;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {colors.map((color) => {
        const selected = active?.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            title={color}
            aria-label={color}
            aria-pressed={selected}
            // Same reason the toolbar buttons prevent mousedown: keep the
            // editor's selection, which the click is about to recolour.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(color)}
            className={cn(
              "size-6 rounded-md border transition-transform hover:scale-110",
              selected
                ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                : "border-black/10 dark:border-white/15",
            )}
            style={{ backgroundColor: color }}
          />
        );
      })}
    </div>
  );
}

/**
 * The native colour input, hidden behind a visible swatch.
 *
 * `swatchClass` paints the control; the `<input>` itself is fully transparent
 * and stretched over it so the browser's own picker still drives it.
 */
export function CustomColorInput({
  label,
  value,
  swatchClass,
  onChange,
}: {
  label: string;
  value: string | undefined;
  swatchClass: string;
  onChange: (color: string) => void;
}) {
  return (
    <label
      className={cn(
        "relative inline-flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded border border-black/10 dark:border-white/15",
        swatchClass,
      )}
    >
      <span className="sr-only">{label}</span>
      <input
        type="color"
        className="absolute inset-0 cursor-pointer opacity-0"
        value={normalizeForInput(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function ResetButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
    >
      <Eraser size={12} />
      {label.replace(/^(Remove|Reset) /, "")}
    </button>
  );
}

/**
 * `<input type="color">` only accepts `#rrggbb`, so a highlight stored as
 * `#fef08a` and one stored as `oklch(...)` both need a legal fallback or
 * React warns about an invalid value on every render.
 */
export function normalizeForInput(value: string | undefined): string {
  const hex = value ? /^#([0-9a-f]{6})$/i.exec(value.trim()) : null;
  return hex ? value!.trim() : "#000000";
}
