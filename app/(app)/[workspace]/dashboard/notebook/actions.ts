"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createNote,
  createNoteType,
  deleteNote,
  toggleNoteArchive,
  toggleNoteFavorite,
  updateNote,
  type Note,
} from "@/lib/api";

export interface CreateNoteActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  createdNanoid?: string;
}

export const initialCreateNoteState: CreateNoteActionState = { status: "idle" };

function pickString(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/**
 * Server Action: create a new note from the "New Note" form on the list page.
 *
 * The form posts `title`, `note_type`, optional `tags` (comma-separated),
 * and optional `content` (JSON-encoded rich-text blob). On success we
 * `redirect` to the new note's detail page so the user lands in the editor.
 */
export async function createNoteAction(
  _prev: CreateNoteActionState,
  formData: FormData,
): Promise<CreateNoteActionState> {
  const title = pickString(formData, "title");
  const noteType = pickString(formData, "note_type") || "general";
  const tagsRaw = pickString(formData, "tags");
  const contentRaw = pickString(formData, "content");

  const fieldErrors: Record<string, string[]> = {};
  if (!title) {
    fieldErrors.title = ["Title is required."];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const domain = pickString(formData, "workspace_domain");
  let created: Note;
  try {
    created = await createNote(
      {
        title,
        note_type: noteType,
        content: contentRaw ? safeParseJson(contentRaw) : {},
        tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
      },
      domain,
    );
  } catch (error) {
    console.error("createNoteAction failed:", error);
    return {
      status: "error",
      message:
        "We could not create the note. The server may be unavailable; please try again.",
    };
  }

  revalidatePath(`/${domain}/dashboard/notebook`);
  redirect(`/${domain}/dashboard/notebook/${created.nanoid}`);
}

/**
 * Server Action: persist metadata changes (title, type, tags) from the
 * note detail page.
 */
export async function updateNoteMetaAction(
  _prev: CreateNoteActionState,
  formData: FormData,
): Promise<CreateNoteActionState> {
  const nanoid = pickString(formData, "nanoid");
  const domain = pickString(formData, "workspace_domain");
  const title = pickString(formData, "title");
  const noteType = pickString(formData, "note_type");
  const tagsRaw = pickString(formData, "tags");

  if (!nanoid) {
    return { status: "error", message: "Missing note id." };
  }
  if (!title) {
    return {
      status: "error",
      fieldErrors: { title: ["Title is required."] },
      message: "Please fix the highlighted fields.",
    };
  }

  try {
    await updateNote(
      nanoid,
      {
        title,
        note_type: noteType || "general",
        tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
      },
      domain,
    );
  } catch (error) {
    console.error("updateNoteMetaAction failed:", error);
    return {
      status: "error",
      message: "We could not save your changes. Please try again.",
    };
  }

  revalidatePath(`/${domain}/dashboard/notebook`);
  revalidatePath(`/${domain}/dashboard/notebook/${nanoid}`);
  return { status: "success", message: "Note saved." };
}

/**
 * Server Action: persist content edits (rich-text JSON) from the detail page.
 */
export async function updateNoteContentAction(
  _prev: CreateNoteActionState,
  formData: FormData,
): Promise<CreateNoteActionState> {
  const nanoid = pickString(formData, "nanoid");
  const domain = pickString(formData, "workspace_domain");
  const contentRaw = pickString(formData, "content");

  if (!nanoid) {
    return { status: "error", message: "Missing note id." };
  }

  try {
    await updateNote(
      nanoid,
      {
        content: contentRaw ? safeParseJson(contentRaw) : {},
      },
      domain,
    );
  } catch (error) {
    console.error("updateNoteContentAction failed:", error);
    return {
      status: "error",
      message: "We could not auto-save your changes.",
    };
  }

  revalidatePath(`/${domain}/dashboard/notebook/${nanoid}`);
  return { status: "success", message: "Saved." };
}

/**
 * Server Action: toggle the favorite flag on a note.
 */
export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const nanoid = pickString(formData, "nanoid");
  const domain = pickString(formData, "workspace_domain");
  if (!nanoid) return;
  try {
    await toggleNoteFavorite(nanoid, domain);
  } catch (error) {
    console.error("toggleFavoriteAction failed:", error);
  }
  revalidatePath(`/${domain}/dashboard/notebook`);
  revalidatePath(`/${domain}/dashboard/notebook/${nanoid}`);
}

/**
 * Server Action: toggle the archived flag on a note.
 */
export async function toggleArchiveAction(formData: FormData): Promise<void> {
  const nanoid = pickString(formData, "nanoid");
  const domain = pickString(formData, "workspace_domain");
  if (!nanoid) return;
  try {
    await toggleNoteArchive(nanoid, domain);
  } catch (error) {
    console.error("toggleArchiveAction failed:", error);
  }
  revalidatePath(`/${domain}/dashboard/notebook`);
  revalidatePath(`/${domain}/dashboard/notebook/${nanoid}`);
}

/**
 * Server Action: soft-delete a note. Used by the "Delete" button on the
 * detail page. Redirects back to the list after.
 */
export async function deleteNoteAction(formData: FormData): Promise<void> {
  const nanoid = pickString(formData, "nanoid");
  const domain = pickString(formData, "workspace_domain");
  if (!nanoid || !domain) return;
  try {
    await deleteNote(nanoid, domain);
  } catch (error) {
    console.error("deleteNoteAction failed:", error);
  }
  revalidatePath(`/${domain}/dashboard/notebook`);
  redirect(`/${domain}/dashboard/notebook`);
}

export interface CreateNoteTypeActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialCreateNoteTypeState: CreateNoteTypeActionState = {
  status: "idle",
};

/**
 * Server Action: create a new workspace-configurable note type.
 */
export async function createNoteTypeAction(
  _prev: CreateNoteTypeActionState,
  formData: FormData,
): Promise<CreateNoteTypeActionState> {
  const name = pickString(formData, "name");
  const key = pickString(formData, "key").toLowerCase();
  const orderRaw = pickString(formData, "order");
  const colorBg = pickString(formData, "color_bg");
  const colorText = pickString(formData, "color_text");

  const fieldErrors: Record<string, string[]> = {};
  if (!name) fieldErrors.name = ["Name is required."];
  if (!key) fieldErrors.key = ["Key is required."];
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const colorCode: { text?: string; bg?: string } = {};
  if (colorBg) colorCode.bg = colorBg;
  if (colorText) colorCode.text = colorText;

  const domain = pickString(formData, "workspace_domain");
  try {
    await createNoteType(
      {
        name,
        key,
        order: orderRaw ? Number(orderRaw) || 0 : 0,
        color_code: colorCode,
      },
      domain,
    );
  } catch (error) {
    console.error("createNoteTypeAction failed:", error);
    return {
      status: "error",
      message: "We could not create the note type.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: `Created note type "${name}".` };
}

function safeParseJson(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return { html: raw };
}