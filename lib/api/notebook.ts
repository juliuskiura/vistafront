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
  const payload = await fetchNotes(opts);
  return unwrap(payload);
}

/**
 * Variant of {@link listNotes} that keeps the raw paginated envelope
 * (`{ count, next, previous, results }`) so a caller can render pagination
 * controls.
 *
 * The distinction matters: `listNotes` unwraps to `Note[]` and throws the
 * `count` away, so a UI built on it cannot tell "page 1 of 1" from "page 1
 * of 12" and reports `results.length` as the total — which is the page size,
 * not the workspace's note count.
 *
 * A flat-array response (a non-paginated viewset, or a proxy that strips
 * the envelope) is normalised back into an envelope with the correct
 * `count` rather than degrading to zero, so callers never have to branch.
 */
export async function paginatedListNotes(
  opts: ListNotesOptions,
): Promise<Paginated<Note>> {
  const payload = await fetchNotes(opts);
  if (Array.isArray(payload)) {
    return {
      count: payload.length,
      next: null,
      previous: null,
      results: payload,
    };
  }
  return {
    count: payload?.count ?? 0,
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
    results: Array.isArray(payload?.results) ? payload.results : [],
  };
}

async function fetchNotes(
  opts: ListNotesOptions,
): Promise<Note[] | Paginated<Note>> {
  const { workspace, ...rest } = opts;
  return serverFetch<Note[] | Paginated<Note>>(
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
  // The notebook viewset is globally paginated (25/page). Note types are a
  // small, workspace-scoped catalogue that the UI renders in full — as filter
  // chips, as the composer's options, and as the accent lookup — so a
  // truncated list would silently hide categories. `page_size` is clamped to
  // `max_page_size = 100` server-side.
  const payload = await serverFetch<NoteTypeOption[] | Paginated<NoteTypeOption>>(
    `/apis/notebook/note-types/${toQueryString({ page_size: 100 })}`,
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