"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "@/lib/icons";
import type { NoteTypeOption } from "@/lib/api";
import { cn } from "@/lib/utils";

import { createNoteAction } from "../actions";
import {
  initialNoteActionState,
  type NoteActionState,
} from "../action-state";
import { FieldError, INPUT_CLASS } from "./form-primitives";
import { NoteTypeDialog } from "./note-type-dialog";

interface NoteComposerProps {
  workspaceDomain: string;
  noteTypes: NoteTypeOption[];
  /**
   * `banner` sits on the coloured Banner strip (white button); `toolbar`
   * sits on the page background (primary button).
   */
  placement?: "banner" | "toolbar";
  defaultOpen?: boolean;
  className?: string;
}

/**
 * The "new note" composer.
 *
 * A dialog rather than an inline expanding panel, so the same component can
 * sit in the Banner's action slot without a full-width form being squeezed
 * into the banner strip. That also keeps the trigger's open state local —
 * the page stays a Server Component instead of lifting `open` here just to
 * control a button it does not itself render.
 *
 * On success the Server Action redirects into the new note's page, so there
 * is no success state to render: only validation errors and the transport
 * failure message.
 */
export function NoteComposer({
  workspaceDomain,
  noteTypes,
  placement = "toolbar",
  defaultOpen = false,
  className,
}: NoteComposerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [state, formAction, pending] = useActionState<NoteActionState, FormData>(
    createNoteAction,
    initialNoteActionState,
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
              placement === "banner"
                ? "bg-white text-primary-700 hover:bg-primary-50"
                : "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
              className,
            )}
          >
            <Plus size={placement === "banner" ? 16 : 15} />
            New note
          </button>
        </DialogTrigger>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New note</DialogTitle>
            <DialogDescription>
              Give it a title and a type. You can add tags and content once it
              is open.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4" noValidate>
            <input type="hidden" name="workspace_domain" value={workspaceDomain} />

            <div className="space-y-1.5">
              <label htmlFor="nb-title" className="text-xs font-medium">
                Title
              </label>
              <input
                id="nb-title"
                name="title"
                required
                autoFocus
                placeholder="What is this note about?"
                aria-invalid={!!state.fieldErrors?.title}
                className={INPUT_CLASS}
              />
              <FieldError errors={state.fieldErrors?.title} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="nb-type" className="text-xs font-medium">
                  Type
                </label>
                <select
                  id="nb-type"
                  name="note_type"
                  defaultValue={noteTypes[0]?.key ?? "general"}
                  className={INPUT_CLASS}
                >
                  {noteTypes.length === 0 ? (
                    <option value="general">General</option>
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
                <label htmlFor="nb-tags" className="text-xs font-medium">
                  Tags
                </label>
                <input
                  id="nb-tags"
                  name="tags"
                  placeholder="planning, q4"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {state.status === "error" && !state.fieldErrors ? (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {state.message}
              </p>
            ) : null}

            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Creating…" : "Create note"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => setTypeDialogOpen(true)}
                className="ml-auto text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                New type
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <NoteTypeDialog
        open={typeDialogOpen}
        onOpenChange={setTypeDialogOpen}
        workspaceDomain={workspaceDomain}
        suggestedOrder={noteTypes.length + 1}
      />
    </>
  );
}
