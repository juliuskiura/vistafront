"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";

import { GripVertical } from "@/lib/icons";
import { cn } from "@/lib/utils";

import { blockDrag } from "../block-drag";
import { BlockMenu } from "./editor-block-menu";

interface Target {
  pos: number;
  node: PMNode;
  /** The hovered block's element — carries the `editor-block-active` class. */
  dom: HTMLElement;
  /** Viewport coordinates — the handle is portalled with `position: fixed`. */
  rect: DOMRect;
}

/**
 * The block rail: an insert button, a drag grip, and the block menu.
 *
 * ## Ported from the frontapp
 *
 * This reproduces `features/shared/editor/DragHandle.tsx` as it stood at
 * `4c97c34^`, the commit that deleted the old frontend. Three behaviours came
 * across with it and had been lost in the Next.js port:
 *
 * 1. **Hover, not mousemove.** The rail attaches to the block under the
 *    pointer via `mouseover` and the nearest `.ProseMirror > *`, so it appears
 *    the moment the pointer enters a block rather than only once the pointer
 *    has resolved a document position inside one.
 * 2. **The `+` insert button**, sitting to the left of the grip. It inserts an
 *    empty paragraph directly after the hovered block — the fastest way to
 *    keep writing without leaving the keyboard.
 * 3. **The block highlight** (`.editor-block-active` in `globals.css`), a faint
 *    wash behind the block the rail is attached to, so it is obvious which
 *    block a subsequent drag or menu action will hit.
 *
 * The drag image is also restored: without it the browser drags a
 * near-transparent snapshot of the grip, so the drop reads as the handle
 * itself moving rather than the block.
 *
 * ## What deliberately did *not* come across
 *
 * The frontapp positioned the rail with `position: absolute` plus
 * `window.scrollY`. That cannot work here: the dashboard scrolls an inner
 * `<main>`, not the window, so the rail drifted away from its block on the
 * first scroll. It is portalled with `position: fixed` and driven from
 * `getBoundingClientRect()` instead — same geometry, but viewport-relative.
 *
 * Likewise the frontapp closed the menu on any scroll. Here a scroll just
 * re-reads the rect, so the rail stays attached to its block while a long
 * document moves underneath it, and the menu stays open until dismissed.
 *
 * The grip remains the only drag affordance — see the note below on why
 * nothing else is `draggable`.
 */

/**
 * ## The grip is the only drag affordance
 *
 * An earlier version made every block node `draggable`, which sets
 * `draggable="true"` on the rendered DOM. Browsers only begin a native HTML5
 * drag from a draggable element, so that made *press-and-move over text*
 * reorder the block — which is exactly the gesture people use to select a
 * sentence. Selecting text became impossible anywhere inside a paragraph.
 * `extensions.ts` therefore registers no draggable blocks; the grip is the
 * single place a drag can start, and clicking and holding the six dots is the
 * gesture that moves a block.
 *
 * The grip stays `draggable` because that is what gives it real `dragstart` /
 * `dragover` / `drop` events with a live `DataTransfer`, and those are what
 * ProseMirror's own drop handler reads.
 */
export function EditorDragHandle({ editor }: { editor: Editor | null }) {
  const [target, setTarget] = useState<Target | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const dragging = useRef(false);
  // Pointer position is a ref, not state: `mousemove` fires far more often
  // than React should re-render, and it is only ever read inside the handler.
  const pointer = useRef({ x: 0, y: 0 });

  // The ProseMirror view, held in a ref because `handleDragStart` writes to
  // `view.dragging` from a DOM event handler. Reading `editor.view` there
  // would be a property access on a prop captured during an earlier render,
  // which React is free to have replaced; the view object itself is stable
  // for the editor's lifetime.
  const editorRef = useRef<Editor["view"] | null>(null);

  useEffect(() => {
    editorRef.current = editor?.view ?? null;
  }, [editor]);

  const refreshRect = useCallback(
    (pos: number, node: PMNode, dom: HTMLElement, prev: Target | null): Target | null => {
      const rect = dom.getBoundingClientRect();
      // Reuse the previous object when nothing moved so React can skip the
      // re-render on every mouse event.
      if (prev && prev.pos === pos && prev.dom === dom && prev.rect.top === rect.top) {
        return prev;
      }
      return { pos, node, dom, rect };
    },
    [],
  );

  const resolve = useCallback((target0: EventTarget | null) => {
    if (!editor || dragging.current) return;

    const dom0 = target0 instanceof Element ? target0 : null;
    const blockDom = dom0?.closest(".ProseMirror > *") as HTMLElement | null;
    if (!blockDom) return;

    const view = editor.view;

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
    let pos: number;
    try {
      pos = view.state.doc.resolve(view.posAtDOM(blockDom, 0)).before(1);
    } catch {
      pos = view.posAtCoords({ left: pointer.current.x, top: pointer.current.y })?.inside ?? -1;
      if (pos < 0) return;
    }

    const node = view.state.doc.nodeAt(pos);
    if (!node || !node.isBlock) return;

    setTarget((prev) => refreshRect(pos, node, blockDom, prev));
  }, [editor, refreshRect]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;

    const onOver = (e: MouseEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
      if (menuOpen || dragging.current) return;
      resolve(e.target);
    };

    // `mouseleave` on the editor is not enough on its own: moving from the
    // editor out through the rail's own gutter counts as leaving, and the
    // rail would vanish before it could be used. The rect check below allows
    // for the ~100px the rail occupies to the left of the text.
    const onLeave = (e: MouseEvent) => {
      if (menuOpen || dragging.current) return;
      const rect = dom.getBoundingClientRect();
      const inRail =
        e.clientX >= rect.left - 110 && e.clientX <= rect.right + 24 &&
        e.clientY >= rect.top - 24 && e.clientY <= rect.bottom + 24;
      if (inRail) return;
      setTarget(null);
    };

    const onMove = (e: MouseEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
    };

    // Re-read the rect on scroll so the rail stays attached to its block
    // rather than hanging where it was drawn.
    const onViewportChange = () => {
      if (dragging.current) return;
      setTarget((prev) => {
        if (!prev) return null;
        if (!prev.dom.isConnected) return null;
        return refreshRect(prev.pos, prev.node, prev.dom, null);
      });
    };

    dom.addEventListener("mouseover", onOver);
    dom.addEventListener("mousemove", onMove);
    dom.addEventListener("mouseleave", onLeave);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);

    return () => {
      dom.removeEventListener("mouseover", onOver);
      dom.removeEventListener("mousemove", onMove);
      dom.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [editor, menuOpen, resolve, refreshRect]);

  // Highlight the block the rail is attached to. A class rather than a React
  // prop because the element belongs to ProseMirror, which owns its own DOM.
  useEffect(() => {
    const dom = target?.dom;
    if (!dom) return;
    dom.classList.add("editor-block-active");
    return () => dom.classList.remove("editor-block-active");
  }, [target]);

  if (!editor || !target) return null;

  // Captured as locals so the handlers below keep the narrowing. TypeScript
  // does not carry a guard on `target` into a nested function body, and
  // re-checking inside each handler would be noise.
  const { pos, node } = target;
  const commands = editor.commands;

  const top = target.rect.top + 2;

  // 48px to the left of the block, matching the frontapp's `rect.left - 48`,
  // which put the `+` and grip just outside the text column.
  //
  // Clamped to the viewport on a phone. The content area's inset is 8px
  // there — deliberately, it is the frontapp's — so the ideal position is
  // roughly 24px off the left edge and half the rail is unreachable. When the
  // clamp bites, the buttons are given a solid surface so they stay legible
  // where they land, on top of the first few characters rather than beside
  // them.
  const ideal = target.rect.left - 48;
  const left = Math.max(4, ideal);
  const cramped = ideal < left;

  function handleDragStart(e: React.DragEvent) {
    if (dragging.current) return;
    dragging.current = true;
    setMenuOpen(false);

    // Both records are needed, and neither is redundant:
    //
    // - `view.dragging` is what the dropcursor plugin reads to snap the
    //   horizontal drop indicator to a real block boundary, and what makes
    //   ProseMirror pass the slice and the move flag to `handleDrop`.
    // - `blockDrag.pos` records where the block came from. It is set here
    //   rather than by dispatching a `NodeSelection`, because a transaction
    //   dispatched inside `dragstart` re-renders the document mid-gesture and
    //   the drag never takes hold. See `block-drag.ts`.
    const view = editorRef.current;
    blockDrag.current = { pos };
    if (view) {
      view.dragging = {
        slice: view.state.doc.slice(pos, pos + node.nodeSize),
        move: true,
      };
    }

    // Firefox refuses to begin a drag unless some payload is set.
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("text/plain", node.textContent || "");

    // A drag image, because the default is a snapshot of the grip — a
    // near-transparent icon that makes the drop read as the *handle* moving
    // rather than the block. It has to be in the document and non-zero-sized
    // at the moment `setDragImage` is called, so it is parked just off the
    // left edge rather than at `-9999px`, which Chrome renders as empty.
    const preview = document.createElement("div");
    preview.className =
      "pointer-events-none fixed left-0 top-0 -translate-x-[200%] max-w-[300px] truncate rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg";
    preview.textContent = node.textContent || "Moving block…";
    document.body.appendChild(preview);
    e.dataTransfer.setDragImage(preview, 0, 0);
    window.setTimeout(() => preview.remove(), 0);
  }

  function handleDragEnd() {
    dragging.current = false;
    blockDrag.current = null;
    if (editorRef.current) editorRef.current.dragging = null;
    setTarget(null);
  }

  function insertBelow() {
    const at = pos + node.nodeSize;
    commands.insertContentAt(at, { type: "paragraph" });
    commands.focus(at);
    setTarget(null);
  }

  return createPortal(
    <>
      <div
        className={cn(
          "fixed z-50 flex items-center gap-1",
          // Only when the clamp bites: a solid pill so the rail stays readable
          // over the text it now covers, and rounded to match. On a wide
          // window the rail sits in clear space and needs no surface.
          cramped &&
            "rounded-full border bg-popover/95 p-0.5 shadow-sm backdrop-blur-sm",
        )}
        style={{ top, left }}
        onMouseLeave={() => {
          if (!menuOpen) setTarget(null);
        }}
      >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertBelow}
          aria-label="Insert a block below"
          title="Add block below"
          className="flex size-6 items-center justify-center rounded text-sm font-bold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        >
          +
        </button>

        <button
          type="button"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setMenuOpen((v) => !v);
          }}
          aria-label="Drag to reorder, or open block menu"
          title="Drag to move"
          // No `onMouseDown` preventDefault here, matching the frontapp. The
          // usual reason to prevent it is to stop a press turning into a text
          // selection of the surrounding paragraph, but the rail is portalled
          // to `document.body` — the mousedown never reaches ProseMirror, so
          // there is no selection to suppress. Firefox, meanwhile, treats
          // `preventDefault()` on mousedown as a refusal to start a native
          // drag at all, which is the gesture this button exists for.
          //
          // `select-none` is still load-bearing on its own: it stops the press
          // selecting the button's own label.
          className="flex size-6 cursor-grab touch-none select-none items-center justify-center rounded text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
      </div>

      {menuOpen ? (
        <BlockMenu
          top={top + 32}
          left={Math.min(left + 24, window.innerWidth - 224)}
          onDuplicate={() => {
            commands.setNodeSelection(pos);
            const json = node.toJSON();
            commands.insertContentAt(pos + node.nodeSize, json);
            setMenuOpen(false);
            setTarget(null);
          }}
          onDelete={() => {
            commands.setNodeSelection(pos);
            commands.deleteSelection();
            setMenuOpen(false);
            setTarget(null);
          }}
          onTransform={(value) => {
            commands.setNodeSelection(pos);
            if (value === "paragraph") commands.setParagraph();
            if (value === "heading1") commands.toggleHeading({ level: 1 });
            if (value === "heading2") commands.toggleHeading({ level: 2 });
            if (value === "bulletList") commands.toggleBulletList();
            setMenuOpen(false);
            setTarget(null);
          }}
          onDismiss={() => setMenuOpen(false)}
        />
      ) : null}
    </>,
    document.body,
  );
}
