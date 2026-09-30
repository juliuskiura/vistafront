"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PenLine } from "@/lib/icons";
import type { Note, NoteTypeOption } from "@/lib/api";

import { resolveTone, toneColor } from "../../_components/type-swatch";

import { NoteContentEditor } from "./note-content-editor";
import { noteContentHtml } from "./note-header";
import { NoteReader } from "./note-reader";

/**
 * Owns the read / edit switch for a note body.
 *
 * It has to be one component rather than two siblings on the page, because
 * rendering both at once shows the same prose twice: the sanitized read view
 * above, then the editor below holding the identical document. It reads as
 * a bug, because it is one. Only one of the two is ever mounted.
 *
 * A client component for that reason alone — the body itself still renders
 * on the server; this only holds the boolean.
 */
export function NoteBody({
  note,
  type,
  workspaceDomain,
}: {
  note: Note;
  type: NoteTypeOption | null;
  workspaceDomain: string;
}) {
  const [editing, setEditing] = useState(false);
  const saved = noteContentHtml(note.content);
  // The note type's colour, resolved to a validated hex rather than passed
  // through as a backend class string. See `type-swatch.tsx` for why.
  const accent = toneColor(resolveTone(type));

  if (editing) {
    return (
      <NoteContentEditor
        note={note}
        workspaceDomain={workspaceDomain}
        accent={accent}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      <NoteReader note={note} accent={accent} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {saved
            ? "Showing the last saved version."
            : "This note has no content yet."}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setEditing(true)}
        >
          <PenLine size={14} />
          Edit content
        </Button>
      </div>
    </>
  );
}
