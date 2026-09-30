"use client";

import { useActionState, useEffect, useRef, useState, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RichTextEditor } from "@/components/editor";
import { X } from "@/lib/icons";
import type { Note } from "@/lib/api";

import { updateNoteContentAction } from "../../actions";
import {
  initialNoteActionState,
  type NoteActionState,
} from "../../action-state";
import { noteContentHtml } from "./note-header";

/**
 * The note body editor.
 *
 * A full rich-text editor, restored after the Next.js port regressed it to a
 * plain textarea over raw HTML. The legacy frontapp editor could already
 * produce headings, lists, links, task lists, and tables, and existing notes
 * still contain that markup — so editing such a note through a textarea
 * destroyed its formatting on save.
 *
 * Changes are submitted explicitly rather than auto-saved per keystroke:
 * auto-save would fire a Server Action on every keystroke, and each one
 * revalidates the path and re-renders the whole Server Component tree, racing
 * the user's own typing.
 *
 * The editor occupies the same slot as the read view it replaces — see
 * `note-body.tsx` for why only one of the two is ever mounted.
 */
export function NoteContentEditor({
  note,
  workspaceDomain,
  accent,
  onClose,
}: {
  note: Note;
  workspaceDomain: string;
  /** Matches the read view's rule, so the swap does not change the sheet. */
  accent: string;
  onClose: () => void;
}) {
  const saved = noteContentHtml(note.content);

  const [html, setHtml] = useState(saved);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const [state, formAction, pending] = useActionState<NoteActionState, FormData>(
    updateNoteContentAction,
    initialNoteActionState,
  );

  const dirty = html !== saved;
  const wasSuccess = useRef(false);

  // Adopt the server's copy after a successful save. The Server Action
  // revalidates the note path in the same round trip, so `note.content` is
  // already the new HTML by the time this runs — the editor can close and
  // let the reader take over.
  //
  // Keyed off the action state rather than a click handler: a handler would
  // read a stale `state.status`, since `useActionState` updates after the
  // form action resolves.
  useEffect(() => {
    if (state.status === "success" && !wasSuccess.current) {
      wasSuccess.current = true;
      onClose();
    }
    if (state.status === "error") {
      wasSuccess.current = false;
    }
  }, [state, onClose]);

  function requestClose() {
    if (!dirty) {
      onClose();
      return;
    }
    setConfirmDiscard(true);
  }

  function discard() {
    setHtml(saved);
    setConfirmDiscard(false);
    onClose();
  }

  return (
    <>
      <form
        action={formAction}
        className="space-y-3"
        style={{ "--nb-accent": accent } as CSSProperties}
        noValidate
      >
        <input type="hidden" name="workspace_domain" value={workspaceDomain} />
        <input type="hidden" name="nanoid" value={note.nanoid} />

        {/*
          Tiptap owns the document in React state rather than a form control,
          so the HTML is handed to the Server Action through a hidden
          textarea. `readOnly` rather than `disabled`: a disabled control is
          excluded from FormData entirely.
        */}
        <textarea name="content" value={html} readOnly className="hidden" />

        <RichTextEditor
          value={html}
          onChange={setHtml}
          placeholder="Start writing…"
        />

        {state.status === "error" ? (
          <p role="alert" className="text-xs text-destructive">
            {state.message}
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save content"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={requestClose}
            disabled={pending}
          >
            <X size={14} />
            Close
          </Button>
          {dirty && !pending ? (
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
          ) : null}
        </div>
      </form>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard your changes?"
        description="The content you edited has not been saved. Closing the editor will lose it."
        confirmLabel="Discard changes"
        variant="destructive"
        onConfirm={discard}
      />
    </>
  );
}
