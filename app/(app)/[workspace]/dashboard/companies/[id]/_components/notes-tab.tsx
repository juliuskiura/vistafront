"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";
import { useToast } from "@/lib/context";
import { createLinkedNoteAction } from "@/app/(app)/[workspace]/dashboard/companies/[id]/record-note-actions";
import type { Note } from "@/lib/api/types";
import { EmptyTab, TabCard } from "./record-list";

interface Props {
  company: { nanoid: string; name: string };
  workspaceDomain: string;
  notes: Note[];
  noteTypes: { key: string; name: string }[];
  /** The `RelatableModel` nanoid for the "company" record type. */
  relatableNanoid: string | null;
}

/**
 * The notes tab.
 *
 * Shows the notebook notes linked to this company, and creates new ones.
 * The link is a `NoteRelation` pointing at a `RelatableModel` of key
 * "company" — the backend seeds it, so it is looked up rather than
 * hard-coded.
 */
export function NotesTab({
  company,
  workspaceDomain,
  notes,
  noteTypes,
  relatableNanoid,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [noteType, setNoteType] = useState(noteTypes[0]?.key ?? "general");

  const submit = () => {
    if (!relatableNanoid) return;
    startTransition(async () => {
      const result = await createLinkedNoteAction({
        workspaceDomain,
        companyNanoid: company.nanoid,
        title,
        noteType,
        body: body || undefined,
        relatableNanoid,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Note added." });
        setAdding(false);
        setTitle("");
        setBody("");
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not add the note.",
        });
      }
    });
  };

  if (notes.length === 0 && !adding) {
    return (
      <EmptyTab
        title="No notes yet"
        description="Link a notebook note to this company to keep the context with the record."
        action={
          <Button
            type="button"
            onClick={() => setAdding(true)}
            disabled={!relatableNanoid}
          >
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Add note
          </Button>
        }
      />
    );
  }

  return (
    <TabCard
      title="Notes"
      description={`${notes.length} linked from the Notebook`}
      action={
        <Button
          type="button"
          size="sm"
          onClick={() => setAdding((v) => !v)}
          disabled={!relatableNanoid}
        >
          <Plus className="mr-1.5 size-4" aria-hidden="true" />
          Add
        </Button>
      }
    >
      {adding ? (
        <div className="space-y-3 bg-muted/30 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="note-title">Title *</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What should you remember?"
            />
          </div>
          {noteTypes.length > 1 ? (
            <div className="space-y-1.5">
              <Label htmlFor="note-type">Type</Label>
              <select
                id="note-type"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {noteTypes.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="note-body">Note</Label>
            <textarea
              id="note-body"
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
              disabled={pending || !title.trim()}
            >
              {pending ? "Saving…" : "Save note"}
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

      {notes.map((n) => (
        <div key={n.nanoid} className="px-4 py-3">
          <Link
            href={`/${workspaceDomain}/dashboard/notebook/${n.nanoid}`}
            className="truncate text-sm font-medium hover:underline"
          >
            {n.title}
          </Link>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {n.excerpt}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatMediumDate(n.updated_at)}
          </p>
        </div>
      ))}
    </TabCard>
  );
}
