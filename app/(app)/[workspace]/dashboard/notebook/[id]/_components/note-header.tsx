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
import { FieldError, INPUT_CLASS } from "../../_components/form-primitives";
import { updateNoteMetaAction } from "../../actions";

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
  noteTypes: NoteTypeOption[];
  workspaceDomain: string;
  /** Whether the body below is the editor. */
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}

export function NoteHeader({
  note,
  type,
  noteTypes,
  workspaceDomain,
  editing,
  onEditingChange,
}: NoteHeaderProps) {
  const [pinned, setPinned] = useState(false);
  const headRef = useRef<HTMLDivElement>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const [metaPending, setMetaPending] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

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

  const handleTitleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMetaPending(true);
    setMetaError(null);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const result = await (updateNoteMetaAction as unknown as (
      formData: FormData,
    ) => Promise<{ status: string; message?: string; fieldErrors?: Record<string, string[]> }>)(formData);
    setMetaPending(false);
    if (result.status === "success") {
      setEditingTitle(false);
    } else {
      setMetaError(result.message ?? "Could not save title.");
    }
  };

  const handleTypeChange = async (key: string) => {
    if (!type || key === type.key) return;
    setMetaPending(true);
    setMetaError(null);
    const formData = new FormData();
    formData.set("workspace_domain", workspaceDomain);
    formData.set("nanoid", note.nanoid);
    formData.set("title", note.title);
    formData.set("note_type", key);
    formData.set("tags", note.tag_names.join(","));
    const result2 = await (updateNoteMetaAction as unknown as (
      formData: FormData,
    ) => Promise<{ status: string; message?: string; fieldErrors?: Record<string, string[]> }>)(formData);
    setMetaPending(false);
    if (result2.status === "error") {
      setMetaError(result2.message ?? "Could not change note type.");
    }
  };

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
        <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
          <Button asChild variant="outline" size="sm" className="h-8">
            <Link href={`/${workspaceDomain}/dashboard/notebook`}>
              <ArrowLeft size={14} />
              All notes
            </Link>
          </Button>

          <div className="flex-1 min-w-0 flex flex-col gap-1">
            {editingTitle ? (
              <form
                onSubmit={handleTitleSubmit}
                className="flex items-center gap-2"
              >
                <input
                  ref={titleRef}
                  type="text"
                  name="title"
                  defaultValue={note.title}
                  autoFocus
                  className={INPUT_CLASS}
                  maxLength={255}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={metaPending}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingTitle(false)}
                  disabled={metaPending}
                >
                  Cancel
                </Button>
                {metaError && (
                  <p className="text-xs text-destructive">{metaError}</p>
                )}
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h1
                  className={cn(
                    "min-w-0 flex-1 truncate font-bold tracking-[-0.03em] text-foreground transition-[font-size] duration-200",
                    pinned ? "text-lg leading-tight" : "text-2xl leading-[1.15] sm:text-3xl",
                  )}
                >
                  {note.title}
                </h1>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  aria-label="Edit title"
                  disabled={metaPending}
                  onClick={() => setEditingTitle(true)}
                >
                  <PenLine size={14} />
                </Button>
              </div>
            )}
            {metaError && editingTitle === false && (
              <p className="text-xs text-destructive">{metaError}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 min-w-[120px]"
                  disabled={metaPending}
                >
                  <TypeSwatch
                    type={type}
                    fallback={note.note_type_display ?? String(note.note_type)}
                    variant="pill"
                    className="mr-1"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-2">
                <div className="flex flex-col gap-1">
                  {noteTypes.map((t) => {
                    const selected = type?.key === t.key;
                    return (
                      <button
                        key={t.nanoid}
                        type="button"
                        onClick={() => handleTypeChange(t.key)}
                        disabled={selected || metaPending}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent",
                        )}
                      >
                        <TypeSwatch type={t} fallback={t.name} variant="dot" className="size-2" />
                        <span>{t.name}</span>
                        {selected && (
                          <span className="ml-auto text-xs text-primary-foreground">
                            Current
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {editing ? null : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 px-2 sm:px-3"
                aria-label="Edit content"
                disabled={metaPending}
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
        variant="pill"
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
