"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProjectAction,
  initialCreateProjectState,
} from "@/app/(app)/[workspace]/dashboard/projects/actions";

interface Props {
  workspaceDomain: string;
  companies: Array<{ nanoid: string; name: string }>;
  statusOptions: Array<{ value: string; label: string }>;
  priorityOptions: Array<{ value: string; label: string }>;
  hasProjects: boolean;
}

export function NewProjectForm({
  workspaceDomain,
  companies,
  statusOptions,
  priorityOptions,
  hasProjects,
}: Props) {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialCreateProjectState,
  );
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const formError = state.status === "error" ? state.message : null;

  return (
    <Card className="rounded-xl border bg-card p-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="workspace_domain" value={workspaceDomain} />

        <div className="space-y-1.5">
          <Label htmlFor="name">Project name</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g. Q4 launch campaign"
            required
            maxLength={255}
          />
          {errors.name ? (
            <p className="text-xs text-destructive">{errors.name[0]}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="company">Company</Label>
          <select
            id="company"
            name="company"
            required
            defaultValue=""
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <option value="" disabled>
              Pick a company…
            </option>
            {companies.map((c) => (
              <option key={c.nanoid} value={c.nanoid}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.company ? (
            <p className="text-xs text-destructive">{errors.company[0]}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue="planning"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              name="priority"
              defaultValue="medium"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              {priorityOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="start_date">Start date</Label>
            <Input id="start_date" name="start_date" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" name="deadline" type="date" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="What&apos;s this project about?"
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>

        {formError ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button asChild variant="ghost">
            <Link href={`/${workspaceDomain}/dashboard/projects`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending
              ? "Creating…"
              : hasProjects
                ? "Create project"
                : "Create your first project"}
          </Button>
        </div>
      </form>
    </Card>
  );
}