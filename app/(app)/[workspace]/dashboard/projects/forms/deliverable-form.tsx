"use client";

import { useActionState, useEffect, useState } from "react";

import { RichTextEditor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DELIVERABLE_STATUS_OPTIONS,
  DELIVERABLE_TYPE_OPTIONS,
} from "@/lib/projects/constants";
import { createDeliverableAction, updateDeliverableAction } from "@/app/(app)/[workspace]/dashboard/projects/actions/deliverable-actions";
import { initialProjectActionState } from "@/app/(app)/[workspace]/dashboard/projects/action-state";
import type { PickerOption } from "./project-form";

interface Props {
  workspaceDomain: string;
  /** The project the deliverable belongs to. Fixed by the form. */
  projectNanoid: string;
  /** Present when editing; absent when creating. */
  deliverable?: {
    nanoid: string;
    title: string;
    description: string;
    deliverable_type: string | null;
    status: string;
    due_date: string | null;
    assigned_to: string | null;
  };
  members: PickerOption[];
  submitLabel: string;
  onSuccess?: () => void;
}

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

/**
 * The deliverable form.
 *
 * The type picker offers the keys the backend seeded
 * (`blog_post`, `social_post`, …) — the backend reads the type by key, so
 * the key is what goes on the wire.
 */
export function DeliverableForm({
  workspaceDomain,
  projectNanoid,
  deliverable,
  members,
  submitLabel,
  onSuccess,
}: Props) {
  const isEdit = Boolean(deliverable);
  const action = isEdit ? updateDeliverableAction : createDeliverableAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialProjectActionState,
  );
  const [description, setDescription] = useState(
    deliverable?.description ?? "",
  );

  useEffect(() => {
    if (state.status === "success") onSuccess?.();
  }, [state, onSuccess]);

  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const formError = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspace_domain" value={workspaceDomain} />
      <input type="hidden" name="project" value={projectNanoid} />
      {deliverable ? (
        <input type="hidden" name="nanoid" value={deliverable.nanoid} />
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={deliverable?.title ?? ""}
          placeholder="What is being delivered?"
          required
          maxLength={255}
        />
        {errors.title ? (
          <p className="text-xs text-destructive">{errors.title[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="deliverable_type">Type</Label>
          <select
            id="deliverable_type"
            name="deliverable_type"
            defaultValue={deliverable?.deliverable_type ?? ""}
            className={selectClass}
          >
            <option value="">No type</option>
            {DELIVERABLE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={deliverable?.status ?? "draft"}
            className={selectClass}
          >
            {DELIVERABLE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="due_date">Due date</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={deliverable?.due_date ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="assigned_to">Assigned to</Label>
        <select
          id="assigned_to"
          name="assigned_to"
          defaultValue={deliverable?.assigned_to ?? ""}
          className={selectClass}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.nanoid} value={member.nanoid}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <input type="hidden" name="description" value={description} />
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="What should this deliverable contain?"
          showFooter={false}
          className="rounded-lg border"
        />
      </div>

      {formError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
