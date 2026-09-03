"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Save, Star, Trash, Archive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteNoteAction,
  initialCreateNoteState,
  toggleArchiveAction,
  toggleFavoriteAction,
  updateNoteContentAction,
  updateNoteMetaAction,
  type CreateNoteActionState,
} from "@/app/(app)/[workspace]/dashboard/notebook/actions";
import type { Note, NoteAttachment, NoteTypeOption } from "@/lib/api";

interface Props {
  workspaceDomain: string;
  workspaceName: string;
  note: Note;
  attachments: NoteAttachment[];
  noteTypes: NoteTypeOption[];
}

/**
 * Note detail view (Client Component island).
 *
 * Three Server Actions handle writes:
 *   - `updateNoteMetaAction`   — title / type / tags
 *   - `updateNoteContentAction`— rich-text content (explicit save)
 *   - `deleteNoteAction`       — soft-delete + redirect back to the list
 *
 * The favorite / archive toggles fire inline via the same actions used on
 * the list page so behavior is identical between surfaces.
 */
export function NoteDetailView({
  workspaceDomain,
  workspaceName,
  note,
  attachments,
  noteTypes,
}: Props) {
  const router = useRouter();

  const [metaState, metaFormAction, savingMeta] =
    useActionState<CreateNoteActionState, FormData>(
      updateNoteMetaAction,
      initialCreateNoteState,
    );
  const [contentState, contentFormAction, savingContent] =
    useActionState<CreateNoteActionState, FormData>(
      updateNoteContentAction,
      initialCreateNoteState,
    );

  const [editingMeta, setEditingMeta] = useState(false);
  const [editingContent, setEditingContent] = useState(false);

  const tagsString = note.tag_names.join(", ");
  const initialContent = noteContentHtml(note.content);

  const noteTypeLabel =
    noteTypes.find((nt) => nt.key === note.note_type)?.name ??
    note.note_type_display ??
    String(note.note_type);

  function submitQuick(formData: FormData) {
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
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href={`/${workspaceDomain}/dashboard/notebook`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft size={14} />
          Notes
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold">{note.title}</h1>
            <Badge variant="secondary">{noteTypeLabel}</Badge>
            {note.favorite ? (
              <Badge variant="default">Favorite</Badge>
            ) : null}
            {note.archived ? (
              <Badge variant="outline">Archived</Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            in {workspaceName} · updated{" "}
            {new Date(note.updated_at).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action={submitQuick}>
            <input type="hidden" name="__action" value="favorite" />
            <Button
              type="submit"
              size="sm"
              variant={note.favorite ? "default" : "outline"}
            >
              <Star
                size={16}
                className="mr-1.5"
                fill={note.favorite ? "currentColor" : "none"}
              />
              {note.favorite ? "Favorited" : "Favorite"}
            </Button>
          </form>
          <form action={submitQuick}>
            <input type="hidden" name="__action" value="archive" />
            <Button type="submit" size="sm" variant="outline">
              <Archive size={16} className="mr-1.5" />
              {note.archived ? "Unarchive" : "Archive"}
            </Button>
          </form>
          <form
            action={(fd) => {
              fd.set("workspace_domain", workspaceDomain);
              fd.set("nanoid", note.nanoid);
              deleteNoteAction(fd);
            }}
          >
            <Button type="submit" size="sm" variant="destructive">
              <Trash size={16} className="mr-1.5" />
              Delete
            </Button>
          </form>
        </div>
      </div>

      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Metadata</CardTitle>
            {!editingMeta ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditingMeta(true)}
              >
                <Pencil size={14} className="mr-1.5" />
                Edit
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {editingMeta ? (
            <form
              action={(fd) => {
                fd.set("workspace_domain", workspaceDomain);
                fd.set("nanoid", note.nanoid);
                metaFormAction(fd);
              }}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  name="title"
                  defaultValue={note.title}
                  required
                  aria-invalid={!!metaState.fieldErrors?.title}
                />
                {metaState.fieldErrors?.title?.[0] ? (
                  <p className="text-xs text-destructive">
                    {metaState.fieldErrors.title[0]}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note-type">Type</Label>
                <select
                  id="note-type"
                  name="note_type"
                  defaultValue={String(note.note_type)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {noteTypes.length === 0 ? (
                    <option value={String(note.note_type)}>
                      {noteTypeLabel}
                    </option>
                  ) : (
                    noteTypes.map((nt) => (
                      <option key={nt.nanoid} value={nt.key}>
                        {nt.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note-tags">Tags (comma separated)</Label>
                <Input
                  id="note-tags"
                  name="tags"
                  defaultValue={tagsString}
                  placeholder="meeting, planning"
                />
              </div>

              {metaState.status === "success" && metaState.message ? (
                <p className="text-xs text-emerald-600">{metaState.message}</p>
              ) : null}
              {metaState.status === "error" && !metaState.fieldErrors ? (
                <div
                  role="alert"
                  className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {metaState.message}
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button type="submit" disabled={savingMeta}>
                  <Save size={16} className="mr-1.5" />
                  {savingMeta ? "Saving…" : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingMeta(false);
                    router.refresh();
                  }}
                  disabled={savingMeta}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Field label="Title" value={note.title} />
              <Field label="Type" value={noteTypeLabel} />
              <Field
                label="Tags"
                value={
                  note.tag_names.length ? (
                    <div className="flex flex-wrap gap-1">
                      {note.tag_names.map((t) => (
                        <Badge key={t} variant="outline" className="font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )
                }
              />
              <Field
                label="Created"
                value={new Date(note.created_at).toLocaleString()}
              />
            </dl>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Content</CardTitle>
            {!editingContent ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditingContent(true)}
              >
                <Pencil size={14} className="mr-1.5" />
                {initialContent ? "Edit content" : "Add content"}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {editingContent ? (
            <form
              action={(fd) => {
                fd.set("workspace_domain", workspaceDomain);
                fd.set("nanoid", note.nanoid);
                contentFormAction(fd);
              }}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="note-content-html">Rich text (HTML)</Label>
                <textarea
                  id="note-content-html"
                  name="content"
                  defaultValue={initialContent}
                  rows={12}
                  className="flex min-h-[280px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
                <p className="text-xs text-muted-foreground">
                  Plain-HTML editing — the rich-text editor lives in the
                  legacy frontapp. Save to persist, then reopen.
                </p>
              </div>

              {contentState.status === "success" && contentState.message ? (
                <p className="text-xs text-emerald-600">{contentState.message}</p>
              ) : null}
              {contentState.status === "error" ? (
                <div
                  role="alert"
                  className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {contentState.message}
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button type="submit" disabled={savingContent}>
                  <Save size={16} className="mr-1.5" />
                  {savingContent ? "Saving…" : "Save content"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingContent(false);
                    router.refresh();
                  }}
                  disabled={savingContent}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : initialContent ? (
            <div
              className="prose prose-zinc max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: initialContent }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No content yet. Click "Add content" to start writing.
            </p>
          )}
        </CardContent>
      </Card>

      {note.relations.length > 0 ? (
        <Card className="rounded-xl border bg-card">
          <CardHeader>
            <CardTitle>Related to</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {note.relations.map((rel) => (
                <Badge key={rel.nanoid} variant="secondary">
                  {rel.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <CardTitle>
            Attachments ({attachments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attachments yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {attachments.map((att) => (
                <li
                  key={att.nanoid}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="truncate">{att.original_name}</span>
                  <a
                    href={att.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

function noteContentHtml(content: Note["content"]): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (typeof content === "object" && "html" in content) {
    const html = (content as Record<string, unknown>).html;
    return typeof html === "string" ? html : "";
  }
  return "";
}