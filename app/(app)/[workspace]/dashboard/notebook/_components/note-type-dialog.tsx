"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  suggestedOrder: number;
}

/**
 * Creates a workspace note type.
 *
 * Colours are entered as Tailwind class names (`bg-emerald-500`,
 * `text-emerald-700`) and stored on the type's `color_code`. They are
 * validated in the Server Action against an allowlist, and `TypeSwatch`
 * resolves them through a fixed palette rather than passing the string into
 * `className` — so a workspace admin cannot inject arbitrary classes into
 * another member's rendered cards.
 */
export function NoteTypeDialog({
  open,
  onOpenChange,
  workspaceDomain,
  suggestedOrder,
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

        {/* Mounted only while open, so the fields, the derived key, and the
            action state all start fresh on each open. Keeping it mounted and
            clearing fields in an effect would write state on every close and
            cost an extra render pass. */}
        {open ? (
          <NoteTypeForm
            workspaceDomain={workspaceDomain}
            suggestedOrder={suggestedOrder}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function NoteTypeForm({
  workspaceDomain,
  suggestedOrder,
  onDone,
}: {
  workspaceDomain: string;
  suggestedOrder: number;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<NoteActionState, FormData>(
    createNoteTypeAction,
    initialNoteActionState,
  );

  // Derived from the name until the user edits the key directly, so the
  // stored slug is right without typing it.
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);

  const effectiveKey = keyTouched
    ? key
    : name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 64);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="workspace_domain" value={workspaceDomain} />

      <div className="space-y-1.5">
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
          placeholder="Meeting notes"
          aria-invalid={!!state.fieldErrors?.name}
          className={INPUT_CLASS}
        />
        <FieldError errors={state.fieldErrors?.name} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="nt-key" className="text-xs font-medium">
          Key
        </label>
        <input
          id="nt-key"
          name="key"
          required
          value={effectiveKey}
          onChange={(e) => {
            setKeyTouched(true);
            setKey(e.target.value);
          }}
          placeholder="meeting"
          aria-invalid={!!state.fieldErrors?.key}
          className={`${INPUT_CLASS} font-mono`}
        />
        <p className="text-xs text-muted-foreground">
          The stored value the API filter matches on.
        </p>
        <FieldError errors={state.fieldErrors?.key} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="nt-order" className="text-xs font-medium">
            Order
          </label>
          <input
            id="nt-order"
            name="order"
            type="number"
            defaultValue={suggestedOrder}
            className={INPUT_CLASS}
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-medium">Preview</span>
          <div className="flex h-9 items-center">
            <TypeSwatch
              type={{
                nanoid: "preview",
                id: -1,
                key: effectiveKey || "preview",
                name: name || "Preview",
                order: 0,
                color_code: {},
              }}
              fallback="Preview"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="nt-bg" className="text-xs font-medium">
            Accent
          </label>
          <input
            id="nt-bg"
            name="color_bg"
            defaultValue="bg-emerald-500"
            placeholder="bg-emerald-500"
            aria-invalid={!!state.fieldErrors?.color_bg}
            className={`${INPUT_CLASS} font-mono text-xs`}
          />
          <FieldError errors={state.fieldErrors?.color_bg} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="nt-text" className="text-xs font-medium">
            Label
          </label>
          <input
            id="nt-text"
            name="color_text"
            defaultValue="text-emerald-700"
            placeholder="text-emerald-700"
            aria-invalid={!!state.fieldErrors?.color_text}
            className={`${INPUT_CLASS} font-mono text-xs`}
          />
          <FieldError errors={state.fieldErrors?.color_text} />
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
