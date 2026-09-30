"use client";

import { useState } from "react";

import type { Note, NoteAttachment, NoteTypeOption } from "@/lib/api";

import { NoteAttachments, NoteRelations } from "./note-attachments";
import { NoteBody } from "./note-body";
import { NoteHeader } from "./note-header";

/**
 * The interactive spine of the note page.
 *
 * One boolean, `editing`, is the reason this exists as a client island. It is
 * raised by the header's "Edit content" and consumed by the body, and those
 * are not neighbours in the component tree in any arrangement that keeps the
 * page a Server Component: the page renders them as siblings, and a Server
 * Component cannot hold state for them.
 *
 * So the state lives here, in the component that owns both ends. Everything
 * inside still renders what the server already knows — the note, its types,
 * its attachments. Nothing here fetches.
 */
export function NoteDetail({
  note,
  type,
  attachments,
  workspaceDomain,
}: {
  note: Note;
  type: NoteTypeOption | null;
  attachments: NoteAttachment[];
  workspaceDomain: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      {/*
        A direct child of `.nb-sheet`, which is what lets it be sticky: a
        sticky element can only travel as far as its parent's box, and the
        sheet is the only ancestor that spans the whole note. The sheet has no
        `overflow: hidden` for the same reason — see `globals.css`.
      */}
      <NoteHeader
        note={note}
        type={type}
        workspaceDomain={workspaceDomain}
        editing={editing}
        onEditingChange={setEditing}
      />

      <NoteBody
        note={note}
        type={type}
        workspaceDomain={workspaceDomain}
        editing={editing}
        onClose={() => setEditing(false)}
      />

      {/*
        Attachments and relations, the two things the header does not already
        say. The details panel that used to sit here went: it repeated the
        title and the type, both of which the header shows above.
      */}
      <div className="nb-inset-x max-w-3xl space-y-6 border-t border-[var(--nb-rule)] py-6 sm:py-7">
        <NoteAttachments attachments={attachments} />
        <NoteRelations relations={note.relations} />
      </div>
    </>
  );
}
