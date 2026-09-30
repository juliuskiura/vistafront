"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";

import { Copy, GripVertical, Trash2 } from "@/lib/icons";

interface Target {
  pos: number;
  node: PMNode;
  /** Viewport coordinates — the handle is portalled with `position: fixed`. */
  rect: DOMRect;
}

/**
 * A hover grip that reorders the block under the pointer.
 *
 * Restores the drag-and-drop the Notebook port dropped when the legacy
 * frontapp editor was deleted.
 *
 * Two things differ from the legacy implementation, both deliberate:
 *
 * 1. **Fixed, not absolute.** The original positioned itself with
 *    `position: absolute` plus `window.scrollY`. That cannot work in the
 *    dashboard, which scrolls an inner `<main>` rather than the window — the
 *    handle would drift away from its block on the first scroll. This reads
 *    `getBoundingClientRect()` (viewport relative) and portals with
 *    `position: fixed`, so it stays glued regardless of which ancestor scrolls.
 *
 * 2. **`view.dragging`, not a hand-built `dataTransfer` payload.** That field
 *    is what ProseMirror's own drop handler reads, so the drop lands through
 *    the same code path as a native drag instead of a parallel one that can
 *    disagree with it about the slice.
 */
export function EditorDragHandle({ editor }: { editor: Editor | null }) {
  const [target, setTarget] = useState<Target | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const dragging = useRef(false);
  // Pointer position is a ref, not state: `mousemove` fires far more often
  // than React should re-render, and it is only ever read inside the handler.
  const pointer = useRef({ x: 0, y: 0 });
  // The ProseMirror view is an imperative handle we assign to
  // (`view.dragging = …`) inside DOM event handlers. Holding it in a ref is
  // what makes that legal React — mutating a value captured during render is
  // not, and the handle genuinely outlives any single render.
  const viewRef = useRef<Editor["view"] | null>(null);

  useEffect(() => {
    viewRef.current = editor?.view ?? null;
  }, [editor]);

  const refreshRect = useCallback(
    (pos: number, node: PMNode, prev: Target | null): Target | null => {
      const dom = editor?.view.nodeDOM(pos);
      if (!(dom instanceof HTMLElement)) return null;
      // Reuse the previous object when nothing moved so React can skip the
      // re-render on every mouse event.
      if (prev && prev.pos === pos && prev.rect.top === dom.getBoundingClientRect().top) {
        return prev;
      }
      return { pos, node, rect: dom.getBoundingClientRect() };
    },
    [editor],
  );

  const resolve = useCallback(() => {
    if (!editor || dragging.current) return;

    const hit = editor.view.posAtCoords({
      left: pointer.current.x,
      top: pointer.current.y,
    });

    if (!hit || hit.inside < 0) {
      setTarget(null);
      return;
    }

    // Snap to the top-level block so a list or a table drags as one unit
    // rather than tearing off an inner row.
    //
    // `before(1)` is only legal when the resolved position is actually inside
    // a node. When the pointer is over the gap *between* two blocks — or over
    // the very start or end of the document — the position resolves at depth
    // 0, and asking for "the position before depth 0" throws
    // "There is no position before the top-level node". Those gaps are hit
    // constantly, so this has to be handled rather than assumed away: at depth
    // 0 the position itself is the start of the following block, and if there
    // is no following block there is nothing to target.
    const $pos = editor.state.doc.resolve(hit.inside);
    const pos = $pos.depth >= 1 ? $pos.before(1) : hit.inside;
    const node = editor.state.doc.nodeAt(pos);

    if (!node || !node.isBlock) {
      setTarget(null);
      return;
    }

    setTarget((prev) => refreshRect(pos, node, prev));
  }, [editor, refreshRect]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;

    const onMove = (e: MouseEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
      resolve();
    };

    const onLeave = () => {
      if (!dragging.current) setTarget(null);
    };

    // Re-read the rect on scroll so the handle stays attached to its block
    // rather than hanging where it was drawn.
    const onViewportChange = () => {
      if (dragging.current) return;
      setTarget((prev) => {
        if (!prev) return null;
        const dom2 = editor.view.nodeDOM(prev.pos);
        if (!(dom2 instanceof HTMLElement)) return null;
        const rect = dom2.getBoundingClientRect();
        if (prev.rect.top === rect.top && prev.rect.bottom === rect.bottom) {
          return prev;
        }
        return { ...prev, rect };
      });
    };

    dom.addEventListener("mousemove", onMove);
    dom.addEventListener("mouseleave", onLeave);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);

    return () => {
      dom.removeEventListener("mousemove", onMove);
      dom.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [editor, resolve]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  if (!editor || !target) return null;

  // Captured as locals so the handlers below keep the narrowing. TypeScript
  // does not carry a guard on `target` into a nested function body, and
  // re-checking inside each handler would be noise.
  const { pos, node } = target;
  const commands = editor.commands;

  const top = target.rect.top + 2;
  const left = Math.max(8, target.rect.left - 34);

  function handleDragStart(e: React.DragEvent) {
    const view = viewRef.current;
    if (!view) return;

    dragging.current = true;
    setMenuOpen(false);

    // `move: true` removes the original on a successful drop rather than
    // leaving a duplicate behind.
    view.dragging = {
      slice: view.state.doc.slice(pos, pos + node.nodeSize),
      move: true,
    };

    // Firefox refuses to begin a drag unless some payload is set.
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("text/plain", node.textContent || "");
  }

  function handleDragEnd() {
    dragging.current = false;
    setTarget(null);
    if (viewRef.current) viewRef.current.dragging = null;
  }

  function duplicate() {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch(view.state.tr.insert(pos + node.nodeSize, node.toJSON()));
    setMenuOpen(false);
    setTarget(null);
  }

  function remove() {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch(
      view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)),
    );
    // `deleteSelection` runs as a command against the editor's own state,
    // which is the same document the transaction above just selected into.
    commands.deleteSelection();
    setMenuOpen(false);
    setTarget(null);
  }

  return createPortal(
    <>
      <div
        className="fixed z-50 flex items-center"
        style={{ top, left }}
        onMouseLeave={() => {
          if (!menuOpen) setTarget(null);
        }}
      >
        <button
          type="button"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setMenuOpen((v) => !v);
          }}
          aria-label="Drag to reorder, or open block menu"
          title="Drag to move"
          className="flex size-6 cursor-grab items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-50 cursor-default"
          />
          <div
            role="menu"
            className="fixed z-50 w-44 rounded-lg border bg-popover p-1 text-popover-foreground shadow-sm"
            style={{ top: top + 26, left }}
          >
            <button
              type="button"
              role="menuitem"
              onMouseDown={(e) => e.preventDefault()}
              onClick={duplicate}
              className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
            >
              <Copy size={13} className="text-muted-foreground" />
              Duplicate block
            </button>
            <button
              type="button"
              role="menuitem"
              onMouseDown={(e) => e.preventDefault()}
              onClick={remove}
              className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-xs text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 size={13} />
              Delete block
            </button>
          </div>
        </>
      ) : null}
    </>,
    document.body,
  );
}
