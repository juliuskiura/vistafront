import { cn } from "@/lib/utils";

/**
 * The white disc every element in the "Connect Account" showcase row sits in.
 *
 * Shared as a function rather than duplicated per component so a platform disc
 * and the "+ More" marker cannot drift apart — the whole row reads as one set
 * only while they are the same size, radius, and shadow.
 *
 * The disc is white on a saturated brand card, so the shadow is doing the work
 * a border normally would: it lifts the disc off the fill without adding a
 * hard outline that would fight the white glyph inside it.
 *
 * `group-hover` lifts each disc when the whole card is hovered, which turns the
 * row into one affordance instead of seven.
 */
export function discClassName(className?: string): string {
  return cn(
    "flex size-9 shrink-0 items-center justify-center rounded-full bg-white",
    "shadow-[0_2px_6px_-1px_rgba(15,23,42,0.35)] ring-1 ring-black/5",
    "transition-transform duration-200 group-hover:-translate-y-0.5",
    className,
  );
}
