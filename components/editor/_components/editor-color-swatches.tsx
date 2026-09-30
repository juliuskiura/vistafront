/**
 * The two palettes the note colour pickers offer.
 *
 * Kept apart from the picker components so adding a colour is a one-line
 * change in a file with no JSX in it.
 */

/**
 * Ink-first palette: every entry clears 4.5:1 against the note surface, so a
 * coloured run stays readable. A grid of pastel swatches photographs better
 * and is unreadable in the note.
 */
export const TEXT_COLORS = [
  "#0f172a", // slate-900
  "#475569", // slate-600
  "#b91c1c", // red-700
  "#c2410c", // orange-700
  "#a16207", // yellow-700
  "#15803d", // green-700
  "#0f766e", // teal-700
  "#1d4ed8", // blue-700
  "#6d28d9", // violet-700
  "#be185d", // pink-700
  "#000000",
  "#ffffff",
];

/** Backgrounds: light tints for body text, saturated for short runs. */
export const HIGHLIGHT_COLORS = [
  "#fef08a", // yellow-200
  "#fde68a", // amber-200
  "#bbf7d0", // green-200
  "#a7f3d0", // emerald-200
  "#bfdbfe", // blue-200
  "#ddd6fe", // violet-200
  "#fbcfe8", // pink-200
  "#fecaca", // red-200
  "#e5e7eb", // gray-200
  "#94a3b8", // slate-400
  "#fb7185", // rose-400
  "#38bdf8", // sky-400
];
