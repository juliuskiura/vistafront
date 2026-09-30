"use client";

import type { Note, NoteTypeOption } from "@/lib/api";

import { resolveTone, toneColor } from "../../_components/type-swatch";

import { NoteContentEditor } from "./note-content-editor";
import { NoteReader } from "./note-reader";

/**
 * Renders a note body — the reader or the editor, never both.
 *
 * It has to be one component rather than two siblings on the page, because
 * rendering both at once shows the same prose twice: the sanitized read view
 * above, then the editor below holding the identical document. It reads as a
 * bug, because it is one. Only one of the two is ever mounted.
 *
 * The read/edit switch lives in `NoteHeader`, which owns the only control that
 * changes it — "Edit content", in the metadata line. This takes the flag as a
 * prop rather than holding its own, because the control and the thing it
 * controls would otherwise have to be siblings in different files, which is
 * how a stale copy of the state happens.
 */
export function NoteBody({
  note,
  type,
  workspaceDomain,
  editing,
  onClose,
}: {
  note: Note;
  type: NoteTypeOption | null;
  workspaceDomain: string;
  editing: boolean;
  onClose: () => void;
}) {
  // The note type's colour, resolved to a validated hex rather than passed
  // through as a backend class string. See `type-swatch.tsx` for why.
  const accent = toneColor(resolveTone(type));

  if (editing) {
    return (
      <NoteContentEditor
        note={note}
        workspaceDomain={workspaceDomain}
        accent={accent}
        onClose={onClose}
      />
    );
  }

  return <NoteReader note={note} accent={accent} />;
}
