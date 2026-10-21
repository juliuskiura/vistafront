"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HueColorPicker } from "@/components/editor/_components/editor-color-palette";

import { createNoteTypeAction } from "../actions";
import {
  initialNoteActionState,
  type NoteActionState,
} from "../action-state";
import { TypeSwatch } from "./type-swatch";
import { FieldError, INPUT_CLASS } from "./form-primitives";

interface NoteTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceDomain: string;
}

/**
 * Creates a workspace note type.
 *
 * Colours are picked as hex values (`#e5e7eb`, `#000000`) and stored on the
 * type's `color_code`. They are validated in the Server Action against a hex
 * pattern, and `TypeSwatch` renders them inline as CSS colours — so a
 * workspace admin cannot inject arbitrary values into rendered cards.
 */
export function NoteTypeDialog({
  open,
  onOpenChange,
  workspaceDomain,
}: NoteTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New note type</DialogTitle>
          <DialogDescription>
            A workspace-wide category. Its colour becomes the accent rule on
            every note of this type.
          </DialogDescription>
        </DialogHeader>

        {/* Mounted only while open, so the fields and the action state all
            start fresh on each open. */}
        {open ? (
          <div className="overflow-y-auto space-y-4">
            <NoteTypeForm
              workspaceDomain={workspaceDomain}
              onDone={() => onOpenChange(false)}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function NoteTypeForm({
  workspaceDomain,
  onDone,
}: {
  workspaceDomain: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<NoteActionState, FormData>(
    createNoteTypeAction,
    initialNoteActionState,
  );

  const [name, setName] = useState("");
  const [colorCode, setColorCode] = useState({
    bg: "#e5e7eb",
    text: "#000000",
  });

  // Auto-close the dialog once the Server Action reports success.
  useEffect(() => {
    if (state.status === "success") {
      onDone();
    }
  }, [state.status, onDone]);

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="workspace_domain" value={workspaceDomain} />

      <div className="space-y-1">
        <label htmlFor="nt-name" className="text-xs font-medium">
          Name
        </label>
        <input
          id="nt-name"
          name="name"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Note Type/Category Name"
          aria-invalid={!!state.fieldErrors?.name}
          className={INPUT_CLASS}
        />
        <FieldError errors={state.fieldErrors?.name} />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">Preview</span>
        <div className="flex h-8 items-center">
          <TypeSwatch
            type={{
              nanoid: "preview",
              id: -1,
              key: name || "preview",
              name: name || "Preview",
              order: 0,
              color_code: colorCode,
            }}
            fallback="Preview"
            variant="pill"
          />
        </div>
      </div>

      <div className="space-y-3">
        <HueColorPicker
          label="Text Background"
          value={colorCode.bg}
          onChange={(color) => {
            setColorCode((prev) => ({ ...prev, bg: color }));
          }}
        />
        <HueColorPicker
          label="Text Color"
          value={colorCode.text}
          onChange={(color) => {
            setColorCode((prev) => ({ ...prev, text: color }));
          }}
        />
      </div>

      <input type="hidden" name="color_bg" value={colorCode.bg} />
      <input type="hidden" name="color_text" value={colorCode.text} />

      {state.status === "error" && !state.fieldErrors ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-xs text-emerald-600">{state.message}</p>
      ) : null}

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDone}
          disabled={pending}
        >
          Close
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creating…" : "Create type"}
        </Button>
      </div>
    </form>
  );
}
