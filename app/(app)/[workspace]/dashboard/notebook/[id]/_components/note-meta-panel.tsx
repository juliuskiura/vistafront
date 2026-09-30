"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PenLine } from "@/lib/icons";
import type { Note, NoteTypeOption } from "@/lib/api";

import { updateNoteMetaAction } from "../../actions";
import {
  initialNoteActionState,
  type NoteActionState,
} from "../../action-state";
import { FieldError, INPUT_CLASS } from "../../_components/form-primitives";

interface NoteMetaPanelProps {
  note: Note;
  noteTypes: NoteTypeOption[];
  workspaceDomain: string;
}

/**
 * Editable title, type, and tags.
 *
 * Collapsed by default: a note's title is not something most visits change,
 * so the rail shows read-only values until asked. Collapsing also keeps the
 * rail's height stable, which matters because it is sticky.
 */
export function NoteMetaPanel({
  note,
  noteTypes,
  workspaceDomain,
}: NoteMetaPanelProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<NoteActionState, FormData>(
    updateNoteMetaAction,
    initialNoteActionState,
  );

  if (!editing) {
    return (
      <div className="space-y-2">
        <RailLabel
          action={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-6"
              onClick={() => setEditing(true)}
              aria-label="Edit title, type and tags"
            >
              <PenLine size={12} />
            </Button>
          }
        >
          Details
        </RailLabel>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Title</dt>
            <dd className="mt-0.5 font-medium leading-snug">{note.title}</dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Type</dt>
            <dd className="mt-0.5">
              {note.note_type_display ?? String(note.note_type)}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Tags</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {note.tag_names.length ? (
                note.tag_names.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="workspace_domain" value={workspaceDomain} />
      <input type="hidden" name="nanoid" value={note.nanoid} />

      <RailLabel>Edit details</RailLabel>

      <div className="space-y-1.5">
        <label htmlFor="note-title" className="text-xs font-medium">
          Title
        </label>
        <input
          id="note-title"
          name="title"
          required
          defaultValue={note.title}
          autoFocus
          aria-invalid={!!state.fieldErrors?.title}
          className={INPUT_CLASS}
        />
        <FieldError errors={state.fieldErrors?.title} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="note-type" className="text-xs font-medium">
          Type
        </label>
        <select
          id="note-type"
          name="note_type"
          defaultValue={String(note.note_type)}
          className={INPUT_CLASS}
        >
          {noteTypes.length === 0 ? (
            <option value={String(note.note_type)}>
              {note.note_type_display ?? String(note.note_type)}
            </option>
          ) : (
            noteTypes.map((t) => (
              <option key={t.nanoid} value={String(t.key)}>
                {t.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="note-tags" className="text-xs font-medium">
          Tags
        </label>
        <input
          id="note-tags"
          name="tags"
          defaultValue={note.tag_names.join(", ")}
          placeholder="meeting, planning"
          className={INPUT_CLASS}
        />
      </div>

      {state.status === "error" && !state.fieldErrors ? (
        <p role="alert" className="text-xs text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setEditing(false);
            router.refresh();
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function RailLabel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h2>
      {action}
    </div>
  );
}
