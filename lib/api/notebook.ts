import { serverFetch } from "./server-fetch";
import { toQueryString } from "./query-string";
import type {
  CreateNoteBody,
  CreateNoteTypeBody,
  Note,
  NoteAttachment,
  NoteTypeOption,
  Paginated,
  UpdateNoteBody,
} from "./types";

/**
 * Every list endpoint in this Django app is globally paginated
 * (``LivechatPagination``, page size 25), so responses come back as
 * ``{ count, next, previous, results }`` instead of a plain array. Unwrap the
 * ``results`` page defensively: raw arrays pass through, non-array error
 * payloads degrade to an empty list instead of crashing callers.
 */
function unwrap<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as Paginated<T>).results)) {
    return (payload as Paginated<T>).results;
  }
  return [];
}

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

export async function listNotes(opts: ListNotesOptions): Promise<Note[]> {
  const { workspace, ...rest } = opts;
  const payload = await serverFetch<Note[] | Paginated<Note>>(
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
  return unwrap(payload);
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

export async function listNoteAttachments(
  noteNanoid: string,
  workspace: string,
): Promise<NoteAttachment[]> {
  const payload = await serverFetch<NoteAttachment[] | Paginated<NoteAttachment>>(
    `/apis/notebook/attachments/${toQueryString({ note: noteNanoid })}`,
    { workspace },
  );
  return unwrap(payload);
}

/* ──────────────────────────────────────────────────────────────────────
 * Note types (workspace-configurable)
 * ────────────────────────────────────────────────────────────────────── */

export async function listNoteTypes(
  workspace: string,
): Promise<NoteTypeOption[]> {
  const payload = await serverFetch<NoteTypeOption[] | Paginated<NoteTypeOption>>(
    "/apis/notebook/note-types/",
    { workspace },
  );
  return unwrap(payload);
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