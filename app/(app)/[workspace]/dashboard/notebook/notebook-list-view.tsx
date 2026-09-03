"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileEdit, Plus, Star, Archive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  initialCreateNoteState,
  createNoteAction,
  initialCreateNoteTypeState,
  createNoteTypeAction,
  toggleArchiveAction,
  toggleFavoriteAction,
  type CreateNoteActionState,
  type CreateNoteTypeActionState,
} from "@/app/(app)/[workspace]/dashboard/notebook/actions";
import type { Note, NoteTypeOption } from "@/lib/api";

interface Props {
  workspaceDomain: string;
  workspaceNanoid: string;
  workspaceName: string;
  notes: Note[];
  noteTypes: NoteTypeOption[];
  initialSearch: string;
  initialType: string;
  showArchived: boolean;
}

/**
 * Notebook list view (Client Component island).
 *
 * Hosts the inline "New Note" composer (so the table itself can stay on the
 * server) and the "New Note Type" dialog. Per-row favorite / archive actions
 * post via Server Actions (toggleFavoriteAction / toggleArchiveAction) and
 * `router.refresh()` so the server-rendered list re-runs.
 */
export function NotebookListView({
  workspaceDomain,
  workspaceNanoid,
  workspaceName,
  notes,
  noteTypes,
  initialSearch,
  initialType,
  showArchived,
}: Props) {
  const router = useRouter();
  const [composing, setComposing] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);

  const [createState, createFormAction, creating] =
    useActionState<CreateNoteActionState, FormData>(
      createNoteAction,
      initialCreateNoteState,
    );

  const [typeState, typeFormAction, creatingType] =
    useActionState<CreateNoteTypeActionState, FormData>(
      createNoteTypeAction,
      initialCreateNoteTypeState,
    );

  const [pendingNav, startNav] = useTransition();

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const search = String(fd.get("search") ?? "").trim();
    const type = String(fd.get("note_type") ?? "").trim();
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (type) qs.set("note_type", type);
    if (showArchived) qs.set("archived", "true");
    startNav(() => {
      router.push(`/${workspaceDomain}/dashboard/notebook${qs.toString() ? `?${qs}` : ""}`);
    });
  }

  function toggleArchivedView() {
    const qs = new URLSearchParams();
    if (initialSearch) qs.set("search", initialSearch);
    if (initialType) qs.set("note_type", initialType);
    if (!showArchived) qs.set("archived", "true");
    router.push(`/${workspaceDomain}/dashboard/notebook${qs.toString() ? `?${qs}` : ""}`);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <FileEdit size={20} className="text-primary" />
            {showArchived ? "Archived Notes" : "Notes"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {notes.length} {notes.length === 1 ? "note" : "notes"} in {workspaceName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleArchivedView}
          >
            <Archive size={16} className="mr-1.5" />
            {showArchived ? "Active notes" : "Archived"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setComposing((v) => !v)}
          >
            <Plus size={16} className="mr-1.5" />
            New note
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTypeDialogOpen(true)}
          >
            New type
          </Button>
        </div>
      </div>

      {composing ? (
        <Card className="rounded-xl border bg-card p-6">
          <form action={createFormAction} className="space-y-4" noValidate>
            <input type="hidden" name="workspace_domain" value={workspaceDomain} />
            <input type="hidden" name="workspace_nanoid" value={workspaceNanoid} />

            <div className="space-y-2">
              <Label htmlFor="new-note-title">Title</Label>
              <Input
                id="new-note-title"
                name="title"
                placeholder="Note title..."
                required
                autoFocus
                aria-invalid={!!createState.fieldErrors?.title}
              />
              {createState.fieldErrors?.title?.[0] ? (
                <p className="text-xs text-destructive">
                  {createState.fieldErrors.title[0]}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-note-type">Type</Label>
              <select
                id="new-note-type"
                name="note_type"
                defaultValue={noteTypes[0]?.key ?? "general"}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {noteTypes.length === 0 ? (
                  <option value="general">General</option>
                ) : (
                  noteTypes.map((nt) => (
                    <option key={nt.nanoid} value={nt.key}>
                      {nt.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {createState.status === "error" && !createState.fieldErrors ? (
              <div
                role="alert"
                className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {createState.message}
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setComposing(false)}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <form
        className="flex flex-wrap items-end gap-2"
        method="get"
        onSubmit={handleSearchSubmit}
      >
        <div className="flex-1 min-w-[200px] space-y-1">
          <Label htmlFor="notebook-search" className="sr-only">
            Search
          </Label>
          <Input
            id="notebook-search"
            name="search"
            defaultValue={initialSearch}
            placeholder="Search notes…"
          />
        </div>
        <div className="w-40 space-y-1">
          <Label htmlFor="notebook-type-filter" className="sr-only">
            Type
          </Label>
          <select
            id="notebook-type-filter"
            name="note_type"
            defaultValue={initialType}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <option value="">All types</option>
            {noteTypes.map((nt) => (
              <option key={nt.nanoid} value={nt.key}>
                {nt.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={pendingNav}>
          Search
        </Button>
        {initialSearch || initialType || showArchived ? (
          <Link
            href={`/${workspaceDomain}/dashboard/notebook`}
            className="inline-flex h-9 items-center text-xs text-muted-foreground hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {notes.length === 0 ? (
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          {initialSearch
            ? `No notes match "${initialSearch}".`
            : showArchived
              ? "No archived notes."
              : "No notes yet. Create your first note."}
        </Card>
      ) : (
        <Card className="divide-y rounded-xl border bg-card">
          {notes.map((note) => (
            <NoteRow
              key={note.nanoid}
              note={note}
              workspaceDomain={workspaceDomain}
            />
          ))}
        </Card>
      )}

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New note type</DialogTitle>
            <DialogDescription>
              Create a workspace-level category (e.g. Meeting, Idea, SOP) that
              members can use when composing notes.
            </DialogDescription>
          </DialogHeader>
          <form action={typeFormAction} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="nt-name">Name</Label>
              <Input
                id="nt-name"
                name="name"
                placeholder="e.g. Meeting notes"
                required
                autoFocus
                aria-invalid={!!typeState.fieldErrors?.name}
              />
              {typeState.fieldErrors?.name?.[0] ? (
                <p className="text-xs text-destructive">
                  {typeState.fieldErrors.name[0]}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nt-key">Key</Label>
              <Input
                id="nt-key"
                name="key"
                placeholder="e.g. meeting"
                required
                aria-invalid={!!typeState.fieldErrors?.key}
              />
              {typeState.fieldErrors?.key?.[0] ? (
                <p className="text-xs text-destructive">
                  {typeState.fieldErrors.key[0]}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nt-order">Order</Label>
              <Input
                id="nt-order"
                name="order"
                type="number"
                defaultValue={noteTypes.length + 1}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nt-bg">Badge bg class (optional)</Label>
                <Input id="nt-bg" name="color_bg" placeholder="bg-blue-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nt-text">Badge text class (optional)</Label>
                <Input
                  id="nt-text"
                  name="color_text"
                  placeholder="text-blue-700"
                />
              </div>
            </div>

            {typeState.status === "success" ? (
              <p className="text-xs text-emerald-600">{typeState.message}</p>
            ) : typeState.status === "error" && !typeState.fieldErrors ? (
              <div
                role="alert"
                className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {typeState.message}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTypeDialogOpen(false)}
                disabled={creatingType}
              >
                Close
              </Button>
              <Button type="submit" disabled={creatingType}>
                {creatingType ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NoteRow({
  note,
  workspaceDomain,
}: {
  note: Note;
  workspaceDomain: string;
}) {
  const router = useRouter();
  const date = new Date(note.updated_at).toLocaleDateString();

  function submit(formData: FormData) {
    formData.set("workspace_domain", workspaceDomain);
    formData.set("nanoid", note.nanoid);
    const action = String(formData.get("__action") ?? "");
    if (action === "favorite") {
      toggleFavoriteAction(formData);
    } else if (action === "archive") {
      toggleArchiveAction(formData);
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
      <Link
        href={`/${workspaceDomain}/dashboard/notebook/${note.nanoid}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileEdit size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{note.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {note.excerpt || "No content yet"}
          </p>
        </div>
      </Link>
      <div className="hidden items-center gap-1 sm:flex">
        {note.tag_names.slice(0, 2).map((t) => (
          <Badge key={t} variant="outline" className="font-normal">
            {t}
          </Badge>
        ))}
        {note.tag_names.length > 2 ? (
          <span className="text-xs text-muted-foreground">
            +{note.tag_names.length - 2}
          </span>
        ) : null}
      </div>
      <Badge variant="secondary">{note.note_type_display ?? note.note_type}</Badge>
      <span className="hidden text-xs text-muted-foreground sm:inline">{date}</span>
      <form action={submit} className="flex items-center gap-1">
        <input type="hidden" name="__action" value="favorite" />
        <button
          type="submit"
          aria-label={note.favorite ? "Unfavorite" : "Favorite"}
          className={`rounded-md p-1 hover:bg-muted ${
            note.favorite ? "text-amber-500" : "text-muted-foreground"
          }`}
          title={note.favorite ? "Unfavorite" : "Favorite"}
        >
          <Star
            size={16}
            fill={note.favorite ? "currentColor" : "none"}
          />
        </button>
      </form>
      <form action={submit} className="flex items-center">
        <input type="hidden" name="__action" value="archive" />
        <button
          type="submit"
          aria-label={note.archived ? "Unarchive" : "Archive"}
          className={`rounded-md p-1 hover:bg-muted ${
            note.archived ? "text-primary" : "text-muted-foreground"
          }`}
          title={note.archived ? "Unarchive" : "Archive"}
        >
          <Archive size={16} />
        </button>
      </form>
    </div>
  );
}