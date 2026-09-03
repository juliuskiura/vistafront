import "server-only";

import { serverFetch, toQueryString } from "./server-fetch";
import type {
  CreateNoteBody,
  CreateNoteTypeBody,
  Note,
  NoteAttachment,
  NoteTypeOption,
  UpdateNoteBody,
} from "./types";

/* ──────────────────────────────────────────────────────────────────────
 * Notes
 *
 * Notebook endpoints are tenant-scoped. The active workspace slug is
 * forwarded as the ``X-Workspace`` header on every call.
 * ────────────────────────────────────────────────────────────────────── */

export interface ListNotesOptions {
  search?: string;
  note_type?: string;
  favorite?: boolean;
  archived?: boolean;
  tag?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  workspace: string;
}

export function listNotes(opts: ListNotesOptions): Promise<Note[]> {
  const { workspace, ...rest } = opts;
  return serverFetch<Note[]>(
    `/apis/notebook/notes/${toQueryString({
      search: rest.search,
      note_type: rest.note_type,
      favorite:
        typeof rest.favorite === "boolean" ? String(rest.favorite) : undefined,
      archived:
        typeof rest.archived === "boolean" ? String(rest.archived) : undefined,
      tag: rest.tag,
      ordering: rest.ordering,
      page: rest.page,
      page_size: rest.page_size,
    })}`,
    { workspace },
  );
}

export function getNote(nanoid: string, workspace: string): Promise<Note> {
  return serverFetch<Note>(`/apis/notebook/notes/${nanoid}/`, { workspace });
}

export function createNote(
  body: CreateNoteBody,
  workspace: string,
): Promise<Note> {
  return serverFetch<Note>("/apis/notebook/notes/", {
    method: "POST",
    body,
    workspace,
  });
}

export function updateNote(
  nanoid: string,
  body: UpdateNoteBody,
  workspace: string,
): Promise<Note> {
  return serverFetch<Note>(`/apis/notebook/notes/${nanoid}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}

export function deleteNote(nanoid: string, workspace: string): Promise<void> {
  return serverFetch<void>(`/apis/notebook/notes/${nanoid}/`, {
    method: "DELETE",
    workspace,
  });
}

export function toggleNoteFavorite(
  nanoid: string,
  workspace: string,
): Promise<Note> {
  return serverFetch<Note>(`/apis/notebook/notes/${nanoid}/favorite/`, {
    method: "PATCH",
    workspace,
  });
}

export function toggleNoteArchive(
  nanoid: string,
  workspace: string,
): Promise<Note> {
  return serverFetch<Note>(`/apis/notebook/notes/${nanoid}/archive/`, {
    method: "PATCH",
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Note attachments
 * ────────────────────────────────────────────────────────────────────── */

export function listNoteAttachments(
  noteNanoid: string,
  workspace: string,
): Promise<NoteAttachment[]> {
  return serverFetch<NoteAttachment[]>(
    `/apis/notebook/attachments/${toQueryString({ note: noteNanoid })}`,
    { workspace },
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Note types (workspace-configurable)
 * ────────────────────────────────────────────────────────────────────── */

export function listNoteTypes(workspace: string): Promise<NoteTypeOption[]> {
  return serverFetch<NoteTypeOption[]>("/apis/notebook/note-types/", { workspace });
}

export function createNoteType(
  body: CreateNoteTypeBody,
  workspace: string,
): Promise<NoteTypeOption> {
  return serverFetch<NoteTypeOption>("/apis/notebook/note-types/", {
    method: "POST",
    body,
    workspace,
  });
}