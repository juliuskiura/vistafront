"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { flattenError } from "zod";

import {
  createNote,
  createNoteType,
  deleteNote,
  ServerFetchError,
  toggleNoteArchive,
  toggleNoteFavorite,
  updateNote,
  type Note,
} from "@/lib/api";

import {
  colorHexSchema,
  CreateNoteSchema,
  CreateNoteTypeSchema,
  DeleteNoteSchema,
  NoteActionSchema,
  UpdateNoteContentSchema,
  UpdateNoteMetaSchema,
  type NoteActionState,
} from "./action-state";

/**
 * Notebook Server Actions.
 *
 * Every payload is validated against the Zod contract in `action-state.ts`
 * before it reaches `lib/api`. That matters more here than in most features:
 * the workspace domain decides which tenant's notes are visible, and a
 * missing or malformed one does not error — Django's
 * `WorkspaceResolutionMiddleware` falls back to the shared `app` workspace and
 * returns `200 OK` with an empty list. Validation turns that silent
 * empty-page failure into an explicit error.
 *
 * Actions return `NoteActionState` for `useActionState` consumers. The
 * toggle/delete actions return void: they are button presses wired to
 * `ConfirmDialog` and `<form action>`, not validated forms with field-level
 * errors.
 */

/** Collect FormData into a plain object, dropping empty strings. */
function toPayload(formData: FormData): Record<string, string> {
  const payload: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") payload[key] = value;
  }
  return payload;
}

function fail(
  message: string,
  fieldErrors?: Record<string, string[]>,
): NoteActionState {
  return fieldErrors ? { status: "error", message, fieldErrors } : { status: "error", message };
}

function invalid(error: Parameters<typeof flattenError>[0]): NoteActionState {
  const { fieldErrors } = flattenError(error);
  return {
    status: "error",
    message: "Please fix the highlighted fields.",
    fieldErrors: fieldErrors as Record<string, string[]>,
  };
}

/* ──────────────────────────────────────────────────────────────────────
 * Create
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Create a note and redirect into its detail page.
 *
 * `redirect` throws a control-flow signal, so it must stay outside the
 * try/catch — a `NEXT_REDIRECT` swallowed by a catch block turns navigation
 * into a silent no-op.
 */
export async function createNoteAction(
  _prev: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const parsed = CreateNoteSchema.safeParse(toPayload(formData));
  if (!parsed.success) return invalid(parsed.error);

  const { workspace_domain, title, note_type, tags, content } = parsed.data;

  let created: Note;
  try {
    created = await createNote(
      {
        title,
        note_type,
        content: content ? safeParseJson(content) : {},
        tags,
      },
      workspace_domain,
    );
  } catch (error) {
    console.error("createNoteAction failed:", error);
    return {
      status: "error",
      message:
        "We could not create the note. The server may be unavailable; please try again.",
    };
  }

  revalidatePath(`/${workspace_domain}/dashboard/notebook`);
  redirect(`/${workspace_domain}/dashboard/notebook/${created.nanoid}`);
}

/* ──────────────────────────────────────────────────────────────────────
 * Update
 * ────────────────────────────────────────────────────────────────────── */

export async function updateNoteMetaAction(
  _prev: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const parsed = UpdateNoteMetaSchema.safeParse(toPayload(formData));
  if (!parsed.success) return invalid(parsed.error);

  const { workspace_domain, nanoid, title, note_type, tags } = parsed.data;

  try {
    await updateNote(
      nanoid,
      { title, note_type, tags },
      workspace_domain,
    );
  } catch (error) {
    console.error("updateNoteMetaAction failed:", error);
    return {
      status: "error",
      message: "We could not save your changes. Please try again.",
    };
  }

  revalidatePath(`/${workspace_domain}/dashboard/notebook`);
  revalidatePath(`/${workspace_domain}/dashboard/notebook/${nanoid}`);
  return { status: "success", message: "Note saved." };
}

export async function updateNoteContentAction(
  _prev: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const parsed = UpdateNoteContentSchema.safeParse(toPayload(formData));
  if (!parsed.success) return invalid(parsed.error);

  const { workspace_domain, nanoid, content } = parsed.data;

  try {
    await updateNote(
      nanoid,
      { content: content ? safeParseJson(content) : {} },
      workspace_domain,
    );
  } catch (error) {
    console.error("updateNoteContentAction failed:", error);
    return {
      status: "error",
      message: "We could not save your changes. Please try again.",
    };
  }

  revalidatePath(`/${workspace_domain}/dashboard/notebook/${nanoid}`);
  return { status: "success", message: "Saved." };
}

/* ──────────────────────────────────────────────────────────────────────
 * Toggles
 *
 * These are single-button presses bound to `<form action>`, so they return
 * void. They still validate: `nanoid` is interpolated into a URL path, and
 * an unvalidated value there is a path-traversal surface.
 * ────────────────────────────────────────────────────────────────────── */

export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const parsed = NoteActionSchema.safeParse(toPayload(formData));
  if (!parsed.success) return;

  const { workspace_domain, nanoid } = parsed.data;
  try {
    await toggleNoteFavorite(nanoid, workspace_domain);
  } catch (error) {
    console.error("toggleFavoriteAction failed:", error);
  }
  revalidatePath(`/${workspace_domain}/dashboard/notebook`);
  revalidatePath(`/${workspace_domain}/dashboard/notebook/${nanoid}`);
}

export async function toggleArchiveAction(formData: FormData): Promise<void> {
  const parsed = NoteActionSchema.safeParse(toPayload(formData));
  if (!parsed.success) return;

  const { workspace_domain, nanoid } = parsed.data;
  try {
    await toggleNoteArchive(nanoid, workspace_domain);
  } catch (error) {
    console.error("toggleArchiveAction failed:", error);
  }
  revalidatePath(`/${workspace_domain}/dashboard/notebook`);
  revalidatePath(`/${workspace_domain}/dashboard/notebook/${nanoid}`);
}

/* ──────────────────────────────────────────────────────────────────────
 * Delete
 *
 * Soft-delete, then return to the list. Called from the detail page's
 * `ConfirmDialog` and from the card kebab menu — both gated by the dialog
 * (AGENTS.md §8), so this action never fires on a bare click.
 * ────────────────────────────────────────────────────────────────────── */

export async function deleteNoteAction(formData: FormData): Promise<void> {
  const parsed = DeleteNoteSchema.safeParse(toPayload(formData));
  if (!parsed.success) return;

  const { workspace_domain, nanoid } = parsed.data;
  try {
    await deleteNote(nanoid, workspace_domain);
  } catch (error) {
    console.error("deleteNoteAction failed:", error);
  }
  revalidatePath(`/${workspace_domain}/dashboard/notebook`);
  redirect(`/${workspace_domain}/dashboard/notebook`);
}

/* ──────────────────────────────────────────────────────────────────────
 * Note types
 * ────────────────────────────────────────────────────────────────────── */

export async function createNoteTypeAction(
  _prev: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const parsed = CreateNoteTypeSchema.safeParse(toPayload(formData));
  if (!parsed.success) return invalid(parsed.error);

  const { workspace_domain, name, color_bg, color_text } = parsed.data;

  // `color_code` colours are stored as hex and rendered inline as CSS colour
  // values. Validate against the hex schema before they reach the backend so
  // a workspace admin cannot inject arbitrary strings into rendered markup.
  const colorCode: { text?: string; bg?: string } = {};
  const bg = colorHexSchema.safeParse(color_bg ?? "");
  const text = colorHexSchema.safeParse(color_text ?? "");
  if (!bg.success || !text.success) {
    return fail("Enter a hex colour like #000000 for the badge colours.", {
      color_bg: ["Invalid background colour."],
      color_text: ["Invalid text colour."],
    });
  }
  if (bg.data) colorCode.bg = bg.data;
  if (text.data) colorCode.text = text.data;

  try {
    await createNoteType({ name, color_code: colorCode }, workspace_domain);
  } catch (error) {
    if (error instanceof ServerFetchError) {
      try {
        const body = JSON.parse(error.body);
        if (body.name) {
          return fail(
            body.name[0] ?? "A note type with that name already exists.",
            { name: Array.isArray(body.name) ? body.name : [body.name] },
          );
        }
        if (body.non_field_errors) {
          return fail(
            body.non_field_errors[0] ??
              "A note type with that name already exists in this workspace.",
          );
        }
      } catch {
        // Not JSON — fall through to generic message.
      }
    }
    console.error("createNoteTypeAction failed:", error);
    return { status: "error", message: "We could not create the note type." };
  }

  revalidatePath(`/${workspace_domain}/dashboard/notebook`);
  return { status: "success", message: `Created note type “${name}”.` };
}

/* ────────────────────────────────────────────────────────────────────── */

function safeParseJson(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Not JSON — fall through and store the string as an HTML blob, which is
    // what the textarea editor produces.
  }
  return { html: raw };
}
