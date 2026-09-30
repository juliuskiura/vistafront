import Link from "next/link";
import { ArrowLeft, PenLine } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";
import type { Note, NoteTypeOption } from "@/lib/api";

import { NoteCardActions } from "../../_components/note-card-actions";
import { TypeSwatch } from "../../_components/type-swatch";

interface NoteHeaderProps {
  note: Note;
  type: NoteTypeOption | null;
  workspaceDomain: string;
}

/**
 * The note's title block: back link, title, type pill, timestamps, and the
 * star/archive/delete controls.
 *
 * The word count is computed from the rendered HTML rather than stored, since
 * the backend does not track it — it is a reading aid, so approximate is fine.
 */
export function NoteHeader({
  note,
  type,
  workspaceDomain,
}: NoteHeaderProps) {
  const html = noteContentHtml(note.content);
  const words = countWords(html);

  return (
    <header className="space-y-5">
      <Link
        href={`/${workspaceDomain}/dashboard/notebook`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={13} />
        All notes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TypeSwatch
              type={type}
              fallback={note.note_type_display ?? String(note.note_type)}
            />
            {note.archived ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                Archived
              </span>
            ) : null}
          </div>

          {/*
            Set at display size rather than as an `h1` inside the body: the
            title is page furniture, and a document that opens with its own
            `h1` would have two competing first lines.
          */}
          <h1 className="mt-3 text-balance text-3xl font-bold leading-[1.15] tracking-[-0.03em] text-foreground">
            {note.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-l-2 border-[var(--nb-rule)] pl-3 text-xs text-muted-foreground">
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
        </div>

        <NoteCardActions
          workspaceDomain={workspaceDomain}
          nanoid={note.nanoid}
          title={note.title}
          favorite={note.favorite}
          archived={note.archived}
          variant="full"
        />
      </div>
    </header>
  );
}

/** The stored content as an HTML string, whichever shape the API returned. */
export function noteContentHtml(content: Note["content"]): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (typeof content === "object" && "html" in content) {
    const html = (content as Record<string, unknown>).html;
    return typeof html === "string" ? html : "";
  }
  return "";
}

/**
 * A rough word count.
 *
 * Tags are stripped first so `<p>one two</p>` counts two words rather than
 * gluing "two</p>" onto the last word. Entity decoding is not attempted — the
 * count is a reading aid, not a billing metric.
 */
function countWords(html: string): number {
  if (!html) return 0;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}
