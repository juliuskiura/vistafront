import type { CSSProperties } from "react";

import { sanitizeNoteHtml } from "@/lib/api/sanitize-note-html";
import type { Note } from "@/lib/api";

import { noteContentHtml } from "./note-header";

/**
 * The note body, rendered as formatted prose.
 *
 * This replaces `prose prose-zinc`, which was dead: `@tailwindcss/typography`
 * is not a dependency, so those classes never resolved to anything and every
 * note rendered as an unstyled wall of raw HTML. Styling now lives in
 * `.nb-prose` in `app/globals.css`, written out longhand so it works whether
 * or not the plugin is ever added.
 *
 * `.nb-paper` is the surface: a hairline edge, a wide inset, and one very
 * soft shadow. A note is a document, and a document with no surface is text
 * pasted onto the page rather than placed on it.
 *
 * The HTML is passed through `sanitizeNoteHtml` first. Note bodies are
 * user-authored and Django stores them verbatim, so rendering them raw would
 * let any workspace member's markup execute in every other member's session.
 */
export function NoteReader({
  note,
  accent,
}: {
  note: Note;
  /** The note type's validated accent colour, painted as the sheet's rule. */
  accent: string;
}) {
  const html = noteContentHtml(note.content);
  const safe = sanitizeNoteHtml(html);

  if (!safe) {
    return (
      <div className="nb-paper" style={{ "--nb-accent": accent } as CSSProperties}>
        <p className="text-sm text-muted-foreground">
          This note has no content yet.
        </p>
      </div>
    );
  }

  return (
    <div className="nb-paper" style={{ "--nb-accent": accent } as CSSProperties}>
      <div
        className="nb-prose mx-auto max-w-[72ch]"
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    </div>
  );
}
