import { Plus } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { discClassName } from "./disc";

/**
 * The "+ More" marker — the last element in the showcase row.
 *
 * It has to read as "there are more networks behind this" rather than as a
 * twelfth app, which is why it is not another brand disc. Inside the same white
 * disc as the platform logos sit two offset rounded rectangles, drawn as if a
 * small stack of cards were fanned behind each other, with a `+` on the front
 * one. The stack says *collection*; the `+` says *more*; neither of them alone
 * would.
 *
 * The card stack is built from two absolutely positioned spans rather than an
 * icon so the two layers can be offset and rotated independently — a
 * `Layers` glyph is a single mark and cannot express the overlap.
 *
 * The caption sits *below* the disc rather than inside it: at 36px there is no
 * room for a readable label, and putting the "+" inside a circle that also
 * contains a "+" is a symbol doing two jobs.
 */
export function MoreIndicator({ count, className }: { count: number; className?: string }) {
  const title =
    count === 1 ? "1 more network" : `${count} more networks`;

  return (
    <span className={cn("flex shrink-0 flex-col items-center gap-1", className)}>
      <span className={discClassName()} title={title}>
        <span className="relative flex size-7 items-center justify-center" aria-hidden="true">
          {/* Back card, fanned down and to the right. The `primary-50` fill the
              card button wears is within a hair of white, so these layers lean
              on their border alone for the edge they would otherwise get from
              a fill difference. */}
          <span className="absolute left-1/2 top-[62%] size-[18px] -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] rounded-[4px] border border-primary-300 bg-white" />
          {/* Front card, nudged left and counter-rotated so both edges show. */}
          <span className="absolute left-[36%] top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rotate-[10deg] rounded-[4px] border border-primary-300 bg-white" />
          {/* Sits on the front card, so it reads as a badge over the stack. */}
          <Plus className="absolute left-[36%] top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 text-primary-600" strokeWidth={3.25} />
        </span>
      </span>
      <span className="text-[10px] font-semibold leading-none text-primary-500">+ More</span>
    </span>
  );
}
