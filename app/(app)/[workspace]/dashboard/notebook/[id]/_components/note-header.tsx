"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { formatMediumDate } from "@/lib/dates";
import type { Note, NoteTypeOption } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, Info, PenLine } from "@/lib/icons";
import { cn } from "@/lib/utils";

import { NoteCardActions } from "../../_components/note-card-actions";
import { TypeSwatch } from "../../_components/type-swatch";

/**
 * The note's identity block, and the only client component on the page.
 *
 * ## Why it is a Client Component
 *
 * Because it reacts to scroll. A sticky header that also *shrinks* — the title
 * dropping from display size to heading size, and the back link moving up onto
 * the title's line — needs to know where the page is scrolled to, and that
 * cannot be read during a server render. Everything it renders was already
 * known on the server; only the layout responds to the client.
 *
 * ## The two states
 *
 * At rest the block is a title page: back link on its own line, the title at
 * display size, and the metadata beneath it. Once the header pins, it becomes a
 * single compact row — back link, title, tools — so it costs about a third of
 * the height it did before, which is the point of pinning it at all.
 *
 * ## How "pinned" is detected
 *
 * By the header's own position rather than by a scroll offset, so it stays
 * correct no matter how much page padding sits above it. `top: 0` means the
 * scrollport's top edge, so a rect at zero *is* pinned. The listener is
 * attached to the nearest scrollable ancestor because the dashboard scrolls an
 * inner `<main>`, never the window.
 */

/** The nearest ancestor that actually scrolls, or null if the page does. */
function scrollParentOf(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay"
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

interface NoteHeaderProps {
  note: Note;
  type: NoteTypeOption | null;
  workspaceDomain: string;
  /** Whether the body below is the editor. */
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}

export function NoteHeader({
  note,
  type,
  workspaceDomain,
  editing,
  onEditingChange,
}: NoteHeaderProps) {
  const [pinned, setPinned] = useState(false);
  const headRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = headRef.current;
    if (!el) return;

    const scroller = scrollParentOf(el);
    if (!scroller) return;

    /*
     * Pinned means "sitting at its sticky resting position", which is wherever
     * `top` in the stylesheet puts it — `-3rem`, not zero. The threshold is
     * read back off the element rather than hard-coded, so moving the sticky
     * offset in CSS cannot silently break the detection: with a hard-coded
     * zero, the header would report itself pinned the moment it crossed the
     * scrollport's top edge, which is well before it is actually stuck, and
     * the title would shrink while the page was still at rest.
     */
    const restY = (): number => {
      const top = parseFloat(getComputedStyle(el).top);
      return Number.isFinite(top) ? top : 0;
    };

    const measure = () => setPinned(el.getBoundingClientRect().top <= restY() + 0.5);
    measure();
    scroller.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      scroller.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const html = noteContentHtml(note.content);
  const words = countWords(html);

  return (
    /*
     * The inset lives on the inner block, not on the sticky element itself.
     * `nb-sticky-head` paints an opaque background to hide the prose passing
     * under it, and padding on that element would sit *outside* the paint —
     * a transparent gutter down both sides and a transparent band above, with
     * the text scrolling visibly through them. The inner block insets the
     * content while the outer one covers the full width.
     */
    <div ref={headRef} className="nb-sticky-head">
      <div className="nb-inset-x pb-3 pt-5 sm:pb-3.5 sm:pt-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <h1
            className={cn(
              "min-w-0 flex-1 truncate font-bold tracking-[-0.03em] text-foreground transition-[font-size] duration-200",
              pinned ? "text-lg leading-tight" : "text-2xl leading-[1.15] sm:text-3xl",
            )}
          >
            {note.title}
          </h1>

          {/*
            The page's controls, in one cluster: navigation out, information
            in, the action, and the housekeeping behind it.

            Below `sm` this cluster wraps onto its own line under the title,
            because a title, three buttons, and a Quick Tools trigger do not
            fit across a phone. The title drops to `text-2xl` there for the
            same reason — `flex-1` would otherwise squeeze it to nothing
            rather than wrap.
          */}
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
            <Button asChild variant="outline" size="sm" className="h-8">
              <Link href={`/${workspaceDomain}/dashboard/notebook`}>
                <ArrowLeft size={14} />
                All notes
              </Link>
            </Button>

            {/* Phone only. Above `sm` the metadata is its own line, so the
                popover would duplicate it. */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 sm:hidden"
                  aria-label="Note details"
                >
                  <Info size={14} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 text-xs">
                <NoteMeta note={note} type={type} words={words} />
              </PopoverContent>
            </Popover>

            <div className="ml-auto flex items-center gap-2">
              {editing ? null : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 sm:px-3"
                  // Icon only on a phone: the cluster already carries three
                  // controls there, and a fourth word-width button would wrap
                  // the row onto a second line. The label stays in the
                  // accessible name, so this is a width change, not a loss.
                  aria-label="Edit content"
                  onClick={() => onEditingChange(true)}
                >
                  <PenLine size={14} />
                  <span className="hidden sm:inline">
                    {html.trim() ? "Edit content" : "Add content"}
                  </span>
                </Button>
              )}
              <NoteCardActions
                workspaceDomain={workspaceDomain}
                nanoid={note.nanoid}
                title={note.title}
                favorite={note.favorite}
                archived={note.archived}
                variant="full"
              />
            </div>
          </div>
        </div>

        {/* Phone only — the same list, inline. */}
        <div className="mt-2.5 hidden text-xs sm:block">
          <NoteMeta note={note} type={type} words={words} />
        </div>
      </div>
    </div>
  );
}

/**
 * What the note *is*: its type, its state, its tags, and when it last changed.
 *
 * Extracted because it has two homes — the metadata line on a wide screen, and
 * a popover on a phone — and it must be the same list in both. Written twice,
 * the two would drift the first time a field was added, which is exactly the
 * kind of thing nobody notices until a phone user reports a missing tag.
 */
function NoteMeta({
  note,
  type,
  words,
}: {
  note: Note;
  type: NoteTypeOption | null;
  words: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-muted-foreground">
      <TypeSwatch
        type={type}
        fallback={note.note_type_display ?? String(note.note_type)}
      />
      {note.archived ? (
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px]">
          Archived
        </span>
      ) : null}
      {note.tag_names.map((tag) => (
        <span
          key={tag}
          className="rounded-md bg-muted px-1.5 py-0.5 text-[11px]"
        >
          {tag}
        </span>
      ))}

      <span aria-hidden="true" className="opacity-40">
        ·
      </span>
      <span className="inline-flex items-center gap-1.5">
        <PenLine size={12} />
        <time dateTime={note.updated_at}>
          Updated {formatMediumDate(note.updated_at)}
        </time>
      </span>
      <span aria-hidden="true" className="opacity-40">
        ·
      </span>
      <span>{words > 0 ? `${words} words` : "Empty"}</span>
      <span aria-hidden="true" className="opacity-40">
        ·
      </span>
      <time dateTime={note.created_at}>
        Created {formatMediumDate(note.created_at)}
      </time>
    </div>
  );
}

/* ── Content helpers ────────────────────────────────────────────────────────
 * Kept here because the body and the editor both import them from this module,
 * and a word count is a property of the note's HTML, not of the header. */
export function noteContentHtml(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (typeof content === "object" && "html" in content) {
    return String((content as { html?: unknown }).html ?? "");
  }
  return "";
}

/**
 * Words, counted off the rendered HTML.
 *
 * The backend does not track a word count, and it is only a reading aid here,
 * so this is approximate by design: tags are stripped, and entities are left
 * encoded rather than decoded first.
 */
export function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}
