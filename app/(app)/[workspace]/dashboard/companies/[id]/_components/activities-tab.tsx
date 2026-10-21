"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Plus } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";
import { useToast } from "@/lib/context";
import {
  createActivityAction,
  deleteActivityAction,
  updateActivityAction,
} from "@/app/(app)/[workspace]/dashboard/companies/[id]/record-data-actions";
import type { Activity } from "@/lib/api";
import { DeleteRowButton, EmptyTab, TabCard } from "./record-list";

interface Props {
  company: { nanoid: string; name: string };
  workspaceDomain: string;
  activities: Activity[];
  actionTypes: { nanoid: string; name: string }[];
}

/**
 * The activities tab.
 *
 * An activity is a piece of scheduled work — a call, an email, a meeting.
 * The complete toggle is what makes the tab useful as a to-do list: it
 * stamps `completed_at` rather than deleting the record.
 */
export function ActivitiesTab({
  company,
  workspaceDomain,
  activities,
  actionTypes,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [actionType, setActionType] = useState(actionTypes[0]?.nanoid ?? "");
  const [dueAt, setDueAt] = useState("");
  const [body, setBody] = useState("");

  const submit = () => {
    startTransition(async () => {
      const result = await createActivityAction({
        workspaceDomain,
        company: company.nanoid,
        action_type: actionType,
        subject,
        due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
        body: body || undefined,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Activity added." });
        setAdding(false);
        setSubject("");
        setBody("");
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not add the activity.",
        });
      }
    });
  };

  const toggleComplete = (
    activity: Props["activities"][number],
  ) => {
    startTransition(async () => {
      const result = await updateActivityAction({
        workspaceDomain,
        nanoid: activity.nanoid,
        subject: activity.subject,
        due_at: activity.due_at ?? undefined,
        completed: !activity.completed_at,
      });
      if (result.status === "success") {
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not update the activity.",
        });
      }
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteActivityAction({
        workspaceDomain,
        nanoid: deleting,
        company: company.nanoid,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Activity deleted." });
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not delete the activity.",
        });
      }
      setDeleting(null);
    });
  };

  if (activities.length === 0 && !adding) {
    return (
      <EmptyTab
        title="No activities yet"
        description="Schedule the next step — a call, an email, a meeting."
        action={
          <Button type="button" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Add activity
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <TabCard
        title="Activities"
        description={`${activities.length} scheduled`}
        action={
          <Button type="button" size="sm" onClick={() => setAdding((v) => !v)}>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Add
          </Button>
        }
      >
        {adding ? (
          <div className="space-y-3 bg-muted/30 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="activity-subject">Subject *</Label>
              <Input
                id="activity-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What needs doing?"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="activity-type">Action type</Label>
                {actionTypes.length > 0 ? (
                  <select
                    id="activity-type"
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    {actionTypes.map((t) => (
                      <option key={t.nanoid} value={t.nanoid}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No action types are configured for this workspace.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="activity-due">Due</Label>
                <Input
                  id="activity-due"
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activity-body">Details</Label>
              <textarea
                id="activity-body"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={submit}
                disabled={pending || !subject.trim() || !actionType}
              >
                {pending ? "Saving…" : "Save activity"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAdding(false)}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {activities.map((a) => {
          const done = !!a.completed_at;
          const text = (a.content?.text as string | undefined) ?? "";
          return (
            <div key={a.nanoid} className="flex items-start gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => toggleComplete(a)}
                disabled={pending}
                aria-label={done ? `Mark ${a.subject} as not done` : `Mark ${a.subject} as done`}
                aria-pressed={done}
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:border-primary"
                }`}
              >
                {done ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : null}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    done ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {a.subject}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.action_type_name}
                  {a.due_at ? ` · due ${formatMediumDate(a.due_at)}` : ""}
                  {a.contact_name ? ` · ${a.contact_name}` : ""}
                </p>
                {text ? (
                  <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                    {text}
                  </p>
                ) : null}
              </div>
              <DeleteRowButton
                onDelete={() => setDeleting(a.nanoid)}
                label={`Delete activity ${a.subject}`}
                pending={pending}
              />
            </div>
          );
        })}
      </TabCard>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete activity?"
        description="This activity will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        confirming={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
