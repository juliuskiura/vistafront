"use client";

import { Eraser } from "@/lib/icons";
import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

import {
  HIGHLIGHT_COLORS,
  TEXT_COLORS,
} from "./editor-color-swatches";

export { HIGHLIGHT_COLORS, TEXT_COLORS };

/* ────────────────────────────────────────────────────────────────────── */
/* HSV ↔ hex conversion                                                  */
/* ────────────────────────────────────────────────────────────────────── */

interface HSV { h: number; s: number; v: number }

function hexToHsv(hex: string): HSV {
  const m = /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (!m) return { h: 0, s: 0, v: 1 };
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    h =
      max === r
        ? ((g - b) / d) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    h = (h * 60) % 360;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function hsvToHex({ h, s, v }: HSV): string {
  let r = 0, g = 0, b = 0;
  const i = Math.floor((h / 60) % 6);
  const f = (h / 60) % 1;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i) {
    case 0: (r = v), (g = t), (b = p); break;
    case 1: (r = q), (g = v), (b = p); break;
    case 2: (r = p), (g = v), (b = t); break;
    case 3: (r = p), (g = q), (b = v); break;
    case 4: (r = t), (g = p), (b = v); break;
    case 5: (r = v), (g = p), (b = q); break;
  }
  const toHex = (c: number) =>
    Math.round(c * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

/* ────────────────────────────────────────────────────────────────────── */
/* Full colour picker with hue slider + saturation/brightness field      */
/* ────────────────────────────────────────────────────────────────────── */

interface HueColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

/**
 * A colour picker with a 2D saturation/brightness field, a 1D hue slider,
 * and a hex input. Controlled: the caller owns `value` and `onChange`.
 */
export function HueColorPicker({
  value,
  onChange,
  label,
  className,
}: HueColorPickerProps) {
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [isDragging, setIsDragging] = useState<"field" | "hue" | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  const hex = useMemo(() => hsvToHex(hsv), [hsv]);

  const handleFieldChange = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      setHsv((prev) => {
        const next = { ...prev, s: x, v: 1 - y };
        onChange(hsvToHex(next));
        return next;
      });
    },
    [onChange],
  );

  const handleHueChange = useCallback(
    (clientX: number, rect: DOMRect) => {
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setHsv((prev) => {
        const next = { ...prev, h: x * 360 };
        onChange(hsvToHex(next));
        return next;
      });
    },
    [onChange],
  );

  const handleHexChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(input)) {
        setHsv(hexToHsv(input));
        onChange(input);
      }
    },
    [onChange],
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const clientX =
        e.type === "mousemove"
          ? (e as React.MouseEvent<HTMLDivElement>).clientX
          : (e as React.TouchEvent<HTMLDivElement>).touches[0].clientX;
      const clientY =
        e.type === "mousemove"
          ? (e as React.MouseEvent<HTMLDivElement>).clientY
          : (e as React.TouchEvent<HTMLDivElement>).touches[0].clientY;

      if (isDragging === "field") {
        const field = fieldRef.current;
        if (field) {
          handleFieldChange(clientX, clientY, field.getBoundingClientRect());
        }
      } else if (isDragging === "hue") {
        const hue = hueRef.current;
        if (hue) {
          handleHueChange(clientX, hue.getBoundingClientRect());
        }
      }
    },
    [isDragging, handleFieldChange, handleHueChange],
  );

  const handleUp = useCallback(() => setIsDragging(null), []);

  return (
    <div
      className={cn("space-y-2", className)}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseUp={handleUp}
      onTouchEnd={handleUp}
    >
      {label && (
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}

      {/* Saturation / brightness field */}
      <div
        ref={fieldRef}
        data-color-field
        className="relative w-full h-20 rounded-lg border border-input overflow-hidden cursor-crosshair"
        onMouseDown={(e) => {
          setIsDragging("field");
          const rect = e.currentTarget.getBoundingClientRect();
          handleFieldChange(e.clientX, e.clientY, rect);
        }}
        onTouchStart={(e) => {
          setIsDragging("field");
          const rect = e.currentTarget.getBoundingClientRect();
          handleFieldChange(e.touches[0].clientX, e.touches[0].clientY, rect);
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `hsl(${hsv.h}deg, 100%, 50%)` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))",
          }}
        />
        <div
          className="absolute size-2.5 rounded-full border border-white/60 shadow-sm"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            backgroundColor: hex,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="relative w-full h-1.5 rounded-lg border border-input overflow-hidden cursor-pointer"
        data-color-hue
        onMouseDown={(e) => {
          setIsDragging("hue");
          const rect = e.currentTarget.getBoundingClientRect();
          handleHueChange(e.clientX, rect);
        }}
        onTouchStart={(e) => {
          setIsDragging("hue");
          const rect = e.currentTarget.getBoundingClientRect();
          handleHueChange(e.touches[0].clientX, rect);
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
          }}
        />
        <div
          className="absolute size-2 rounded-full border border-white shadow-sm"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            transform: "translateX(-50%)",
            backgroundColor: hsvToHex({ h: hsv.h, s: 1, v: 1 }),
          }}
        />
      </div>

      <div className="flex items-end gap-2">
        <input
          type="text"
          value={hex}
          onChange={handleHexChange}
          className="flex-1 h-7 rounded-md border border-input bg-transparent px-2 text-[11px] text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          placeholder="#000000"
        />
        <div
          className="size-6 rounded-md border border-input"
          style={{ backgroundColor: hex }}
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Existing components (unchanged)                                       */
/* ────────────────────────────────────────────────────────────────────── */

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
