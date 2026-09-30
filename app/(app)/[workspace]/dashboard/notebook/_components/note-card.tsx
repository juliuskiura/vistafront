import Link from "next/link";
import { Paperclip } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Note, NoteTypeOption } from "@/lib/api";

import { NoteCardActions } from "./note-card-actions";
import { TypeSwatch, resolveTone, toneColor } from "./type-swatch";
import type { NoteView } from "../action-state";

interface NoteCardProps {
  note: Note;
  type: NoteTypeOption | null;
  workspaceDomain: string;
  view: NoteView;
  /** 1-based index within the page, used to stagger the entrance. */
  index: number;
}

/**
 * One note. A Server Component — everything rendered here is known at render
 * time; only the star/kebab pair is a client island.
 *
 * The same component serves both layouts. Rather than branching the whole
 * tree twice, the two views share the header and differ only in how the body
 * stacks: the grid shows a type pill and tag row above the excerpt, the rows
 * view moves the pill inline so a full-width row stays scannable.
 *
 * The accent rule (`.nb-accent`) is driven by the note type's resolved tone,
 * which is what gives each category its own visual identity.
 */
export function NoteCard({
  note,
  type,
  workspaceDomain,
  view,
  index,
}: NoteCardProps) {
  const href = `/${workspaceDomain}/dashboard/notebook/${note.nanoid}`;
  const tone = resolveTone(type);
  const isRows = view === "rows";

  return (
    <article
      className={cn(
        "group relative nb-rise h-full",
        // Flat surface: no card border, no shadow. Separation comes from a
        // hairline — a top rule in the grid, a bottom rule in the rows view —
        // plus the grid gap. `h-full` lets the grid's default stretch make
        // every card in a row the same height.
        isRows
          ? "border-b border-[var(--nb-rule)]"
          : "border-t border-[var(--nb-rule)]",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 34}ms` }}
    >
      <Link
        href={href}
        aria-label={note.title}
        className={cn(
          "nb-card nb-accent flex h-full flex-col transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          // The 3px accent rule needs a gutter so it does not collide with the
          // card's text; the rows view adds a little more since it spans the
          // full width.
          isRows ? "px-1 py-3.5 pl-5" : "px-1 pb-5 pl-5 pt-4",
        )}
        style={{ ["--nb-accent" as string]: toneColor(tone) }}
      >
        {/* ── Header ────────────────────────────────────────────── */}
        {/*
          Horizontal padding lives on the Link above, so these wrappers only
          handle the vertical rhythm. Padding them again here was doubling
          the gutter once the flat layout removed the card border.
        */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "font-semibold leading-snug tracking-tight text-foreground",
                // Grid gets a larger, tighter title because it has the room and
                // the grid is where scanning happens; the rows view stays
                // compact so a full-width line stays scannable.
                isRows ? "truncate text-sm" : "line-clamp-2 text-base",
              )}
            >
              {note.title}
            </h3>
          </div>

          <NoteCardActions
            workspaceDomain={workspaceDomain}
            nanoid={note.nanoid}
            title={note.title}
            favorite={note.favorite}
            archived={note.archived}
            className="relative z-10 -mt-1 -mr-1 shrink-0 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 has-[:focus-visible]:opacity-100"
          />
        </div>

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col">
          <p
            className={cn(
              "text-muted-foreground",
              isRows
                ? "mt-1 line-clamp-1 text-xs"
                : "mt-2 line-clamp-3 text-[13px] leading-relaxed",
            )}
          >
            {note.excerpt || "No content yet"}
          </p>

          {/* Tags only earn their space in the grid; in rows they push the
              type pill and date off a single line. */}
          {!isRows && note.tag_names.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {note.tag_names.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {note.tag_names.length > 3 ? (
                <span className="px-0.5 py-0.5 text-[11px] text-muted-foreground/70">
                  +{note.tag_names.length - 3}
                </span>
              ) : null}
            </div>
          ) : null}

          <div
            className={cn(
              "flex items-center gap-2",
              isRows ? "mt-1.5" : "mt-auto pt-3",
            )}
          >
            <TypeSwatch
              type={type}
              fallback={note.note_type_display ?? String(note.note_type)}
            />

            {note.attachment_count ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
                <Paperclip size={11} />
                {note.attachment_count}
              </span>
            ) : null}

            {note.archived ? (
              <span className="text-[11px] text-muted-foreground/70">Archived</span>
            ) : null}

            <time
              dateTime={note.updated_at}
              className={cn(
                "text-[11px] text-muted-foreground/70",
                isRows ? "ml-auto shrink-0" : "ml-auto shrink-0",
              )}
            >
              {formatMediumDate(note.updated_at)}
            </time>
          </div>
        </div>
      </Link>
    </article>
  );
}
