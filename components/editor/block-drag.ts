/**
 * The block currently being dragged by the rail.
 *
 * ## Why this record and not just `view.dragging`
 *
 * Tiptap's own drag recipe sets `view.dragging = { slice, move: true }` from
 * the grip's `dragstart`, and two things then fall out for free:
 *
 * - ProseMirror hands the slice and the move/copy flag to `handleDrop`, so the
 *   drop does not have to reconstruct them.
 * - The dropcursor plugin reads `view.dragging.slice` to snap the indicator to
 *   the nearest position the block actually fits at. Without it the cursor is
 *   drawn at the raw pointer position and comes out as a caret-height sliver
 *   rather than the horizontal line between blocks.
 *
 * What it does *not* carry is the source position. Deleting the block from its
 * origin is a document edit, and the recipe gets that by dispatching a
 * `NodeSelection` from inside `dragstart` — a transaction dispatched mid
 * gesture, which re-renders ProseMirror's DOM while the browser is setting up
 * the drag. That is what made the drag refuse to hold: the drop then had a
 * stale source position to delete from, and the block was inserted while the
 * original stayed put.
 *
 * So the grip publishes the position here instead, and the drop reads it.
 * Deliberately not React state: it is written from a DOM `dragstart` handler
 * and read from a DOM `drop` handler, and a re-render between the two would be
 * enough to lose the drag mid-gesture. `dragend` clears it, so a drag
 * abandoned outside the editor cannot leave a stale record behind.
 */
export const blockDrag: { current: { pos: number } | null } = { current: null };
