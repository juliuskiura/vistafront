import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
// `Table` is a named export here, not a default — the other Tiptap packages
// in this file all use a default export, so it is easy to miss.
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";

// Re-added outside StarterKit. See `draggableBlock` below for why.
import Paragraph from "@tiptap/extension-paragraph";
import Heading from "@tiptap/extension-heading";
import Blockquote from "@tiptap/extension-blockquote";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import CodeBlock from "@tiptap/extension-code-block";
import HorizontalRule from "@tiptap/extension-horizontal-rule";

import type { Extensions, Node } from "@tiptap/core";

export interface CreateEditorExtensionsOptions {
  placeholder?: string;
}

/**
 * Marks a block node as natively draggable.
 *
 * In Tiptap v3 `draggable` is a property of the node *spec*, not a global
 * toggle, so every block type has to opt in individually. It is what makes
 * ProseMirror set `draggable="true"` on the rendered DOM node and populate
 * the drop cursor — without it the grip handle has nothing to grab.
 *
 * The seven StarterKit blocks are re-added here rather than configured
 * through `StarterKit.configure({ … })`, because StarterKit calls
 * `Blockquote.configure(this.options.blockquote)` on its own bundled copy.
 * Passing a pre-extended instance would feed an extension object in as a
 * config bag and silently discard the `draggable` override.
 */
function draggableBlock<T extends Node>(Extension: T) {
  return Extension.extend({ draggable: true });
}

export function createEditorExtensions({
  placeholder = "Start writing…",
}: CreateEditorExtensionsOptions = {}): Extensions {
  return [
    StarterKit.configure({
      // Handed off to the `draggableBlock` copies below.
      paragraph: false,
      heading: false,
      blockquote: false,
      bulletList: false,
      orderedList: false,
      codeBlock: false,
      horizontalRule: false,

      // `target: null` rather than `_blank`: the reader renders in the same
      // tab, and the sanitizer already forces `rel="noopener noreferrer"` on
      // any link that does carry a target.
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      },
      dropcursor: { color: "#4d7fff", width: 3 },
    }),

    draggableBlock(Paragraph),
    draggableBlock(Heading).configure({ levels: [1, 2, 3] }),
    draggableBlock(Blockquote),
    draggableBlock(BulletList),
    draggableBlock(OrderedList),
    draggableBlock(CodeBlock),
    draggableBlock(HorizontalRule),

    Placeholder.configure({ placeholder }),

    // Draggable as a whole block, not item by item: making `taskItem`
    // draggable would let ProseMirror pull an item out of its parent list and
    // produce an invalid document. Dragging the list moves the entire list,
    // which is what the grip resolves to anyway — it snaps to the top-level
    // block.
    draggableBlock(TaskList),
    TaskItem.configure({ nested: true }),

    // Tiptap's Image hardcodes `draggable: true` in its node spec and does
    // not expose it as an option, so it has to be overridden with `extend`.
    // Leaving it on gives the image its own native drag path alongside the
    // grip, so the same block could be picked up two different ways — and a
    // click-drag on an image would start a reorder instead of selecting it.
    // One affordance is easier to reason about.
    Image.extend({ draggable: false }).configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: { loading: "lazy" },
    }),

    // Tables drag as a unit, for the same reason task lists do.
    draggableBlock(Table).configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,

    TextAlign.configure({ types: ["heading", "paragraph"] }),
  ];
}
