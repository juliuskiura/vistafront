"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, X } from "@/lib/icons";
import { useToast } from "@/lib/context";
import { updateCompanyFieldAction } from "@/app/(app)/[workspace]/dashboard/companies/record-actions";

interface InlineFieldProps {
  label: string;
  /** The field name on the company serializer. */
  field: string;
  /** The current value, already formatted for display. */
  display: React.ReactNode;
  /** The raw value to seed the editor with. */
  rawValue: string;
  workspaceDomain: string;
  companyNanoid: string;
  /** Whether the edit pencils are visible. */
  editing: boolean;
  /**
   * The editor, rendered instead of the default text input.
   *
   * A render prop rather than a node, so the editor gets the draft value
   * and the setter — a controlled editor (a select, a number input) cannot
   * work with a value it cannot see.
   */
  children?: (draft: string, setDraft: (value: string) => void) => React.ReactNode;
  /** Called after a successful save, so the parent can refresh. */
  onSaved?: () => void;
  /**
   * Render the editor as a block rather than inline.
   *
   * A tall editor — the rich-text "About" field — does not fit on the same
   * row as the Save button, so the editor takes the full width and the
   * buttons drop below it.
   */
  block?: boolean;
}

/**
 * The shared per-field inline editor.
 *
 * The company record edits one field at a time: the pencil appears only
 * while the record is in edit mode, clicking it opens a small editor, and
 * saving sends *just that field* to the backend. A bad value on one field
 * can therefore never overwrite the rest of the record.
 */
export function InlineField({
  label,
  field,
  display,
  rawValue,
  workspaceDomain,
  companyNanoid,
  editing,
  children,
  onSaved,
  block = false,
}: InlineFieldProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(rawValue);
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await updateCompanyFieldAction({
        workspaceDomain,
        nanoid: companyNanoid,
        field,
        value: draft,
      });
      if (result.status === "success") {
        setOpen(false);
        toast.push({ variant: "success", message: `${label} saved.` });
        onSaved?.();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not save that change.",
        });
      }
    });
  };

  return (
    <div className="group">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={
          block
            ? "flex min-h-6 flex-col items-stretch gap-2 font-medium"
            : "flex min-h-6 items-center gap-2 font-medium"
        }
      >
        {open ? (
          <div
            className={
              block
                ? "flex flex-1 flex-col items-stretch gap-2"
                : "flex flex-1 items-center gap-2"
            }
          >
            {children ? (
              children(draft, setDraft)
            ) : (
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    save();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setOpen(false);
                    setDraft(rawValue);
                  }
                }}
                aria-label={`Edit ${label}`}
                className="h-8"
                autoFocus
              />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={save}
                disabled={pending}
              >
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setDraft(rawValue);
                }}
                disabled={pending}
                aria-label={`Cancel editing ${label}`}
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <span className="min-w-0 flex-1">
              {display || <span className="text-muted-foreground">—</span>}
            </span>
            {editing ? (
              <button
                type="button"
                onClick={() => {
                  setDraft(rawValue);
                  setOpen(true);
                }}
                aria-label={`Edit ${label}`}
                className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </>
        )}
      </dd>
    </div>
  );
}
