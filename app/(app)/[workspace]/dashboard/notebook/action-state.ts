import { z } from "zod";

/**
 * Validation contracts for every Notebook form.
 *
 * These live in a `.ts` file (not `.tsx`) so both the Server Actions and the
 * Client Components that bind them import the same source. A schema here is
 * the single definition of "what a valid note title is" — the form, the
 * Server Action, and the field-error map are all derived from it, so they
 * cannot drift apart.
 */

/* ──────────────────────────────────────────────────────────────────────
 * Shared field schemas
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Note titles are rendered as headings and used in `aria-label`s, so they
 * are trimmed and length-capped rather than passed through raw. The backend
 * stores the title as a slug source, so whitespace-only input is rejected
 * rather than silently becoming an empty slug.
 */
export const noteTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(255, "Title must be 255 characters or fewer.");

/**
 * The workspace slug. Every Notebook call is tenant-scoped and the Django
 * middleware resolves the workspace from this, so an empty or malformed slug
 * would silently fall through to the shared `app` workspace and return an
 * empty list rather than an error. Validating it here turns a silent
 * empty-page bug into a loud error.
 */
export const workspaceDomainSchema = z
  .string()
  .trim()
  .min(1, "Missing workspace.")
  .max(63, "Workspace slug is too long.");

export const noteNanoidSchema = z
  .string()
  .trim()
  .min(1, "Missing note id.")
  .max(64, "Note id is too long.");

/**
 * Note type keys are matched against `NoteTypeOption.key` on the backend
 * (`note_type__key=…`). Constrained to a slug shape so a stray display name
 * cannot be submitted as a key.
 */
export const noteTypeKeySchema = z
  .string()
  .trim()
  .min(1, "Type is required.")
  .max(64, "Type key is too long.")
  .regex(/^[a-z0-9][a-z0-9_-]*$/i, "Type key may contain letters, numbers, dashes and underscores.");

/**
 * Tags arrive from a comma-separated text input. Each individual tag is
 * stripped and empties are dropped rather than becoming blank tags.
 *
 * The transform yields `string[]`, so the default is `[]` — an absent field
 * and an empty field both resolve to the same list.
 */
const tagsSchema = z
  .string()
  .max(2000, "Tags are too long.")
  .transform((raw) =>
    raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 20),
  )
  .default([]);

/**
 * Note content is stored as an HTML blob. The editor is deliberately a plain
 * textarea (see `note-content-editor.tsx`), so the payload can be large. The
 * cap is generous but finite — an unbounded string here is a cheap way to
 * push a multi-megabyte blob through a Server Action on every keystroke-save.
 */
const noteContentSchema = z
  .string()
  .max(500_000, "Note content is too large.")
  .optional()
  .default("");

/* ──────────────────────────────────────────────────────────────────────
 * Create
 * ────────────────────────────────────────────────────────────────────── */

export const CreateNoteSchema = z.object({
  workspace_domain: workspaceDomainSchema,
  title: noteTitleSchema,
  note_type: noteTypeKeySchema.default("general"),
  tags: tagsSchema,
  content: noteContentSchema,
});
export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Update
 * ────────────────────────────────────────────────────────────────────── */

export const UpdateNoteMetaSchema = z.object({
  workspace_domain: workspaceDomainSchema,
  nanoid: noteNanoidSchema,
  title: noteTitleSchema,
  note_type: noteTypeKeySchema.default("general"),
  tags: tagsSchema,
});
export type UpdateNoteMetaInput = z.infer<typeof UpdateNoteMetaSchema>;

export const UpdateNoteContentSchema = z.object({
  workspace_domain: workspaceDomainSchema,
  nanoid: noteNanoidSchema,
  content: noteContentSchema,
});
export type UpdateNoteContentInput = z.infer<typeof UpdateNoteContentSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Toggle / delete
 *
 * These are button presses rather than user-authored forms, so the payload is
 * only the routing triple. They are still validated: the nanoid and domain
 * are interpolated into a URL path on the server, and an unvalidated value
 * there would be a path-traversal surface.
 * ────────────────────────────────────────────────────────────────────── */

export const NoteActionSchema = z.object({
  workspace_domain: workspaceDomainSchema,
  nanoid: noteNanoidSchema,
});
export type NoteActionInput = z.infer<typeof NoteActionSchema>;

export const DeleteNoteSchema = NoteActionSchema;

/* ──────────────────────────────────────────────────────────────────────
 * Note types
 * ────────────────────────────────────────────────────────────────────── */

/**
 * `color_code` is a `{ text, bg }` pair of Tailwind class strings rendered as
 * a badge on a note card. The backend stores raw class strings, so they are
 * validated against a strict allowlist here: an arbitrary class string from a
 * workspace admin would otherwise become an injection vector into
 * `className`.
 *
 * Only full literal class names from the palette are accepted. Anything with
 * a bracket, parenthesis, or quote is rejected.
 */
const colorClassSchema = z
  .string()
  .trim()
  .max(64, "Color class is too long.")
  .regex(
    /^[a-z0-9:\/\[\]%-]*$/i,
    "Color must be a plain Tailwind class name (e.g. bg-emerald-500).",
  );

export const CreateNoteTypeSchema = z.object({
  workspace_domain: workspaceDomainSchema,
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(80, "Name must be 80 characters or fewer."),
  key: noteTypeKeySchema,
  order: z.coerce
    .number()
    .int("Order must be a whole number.")
    .min(0, "Order cannot be negative.")
    .max(999, "Order is too large.")
    .default(0),
  color_bg: z.string().trim().max(64).optional().default(""),
  color_text: z.string().trim().max(64).optional().default(""),
});
export type CreateNoteTypeInput = z.infer<typeof CreateNoteTypeSchema>;

export { colorClassSchema };

/* ──────────────────────────────────────────────────────────────────────
 * Action state
 *
 * `fieldErrors` maps a form field name to a list of messages, which is
 * exactly the shape `useActionState` components read to render inline errors.
 * ────────────────────────────────────────────────────────────────────── */

export interface NoteActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialNoteActionState: NoteActionState = { status: "idle" };

/* ──────────────────────────────────────────────────────────────────────
 * Pagination + view mode
 *
 * The allowlists here mirror the backend's own. `notebook/pagination.py`
 * defines `ALLOWED_PAGE_SIZES = (25, 50, 75, 100)` and snaps any other value
 * to the nearest allowed size, so accepting an arbitrary integer would show
 * the user one page size in the selector while the server served another.
 * ────────────────────────────────────────────────────────────────────── */

export const NOTE_PAGE_SIZES = [25, 50, 75, 100] as const;
export type NotePageSize = (typeof NOTE_PAGE_SIZES)[number];
export const DEFAULT_NOTE_PAGE_SIZE: NotePageSize = 25;

export const NOTE_VIEWS = ["grid", "rows"] as const;
export type NoteView = (typeof NOTE_VIEWS)[number];
export const DEFAULT_NOTE_VIEW: NoteView = "grid";

export function parseNotePageSize(raw: string | undefined): NotePageSize {
  const n = Number(raw);
  return (NOTE_PAGE_SIZES as readonly number[]).includes(n)
    ? (n as NotePageSize)
    : DEFAULT_NOTE_PAGE_SIZE;
}

export function parseNotePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function parseNoteView(raw: string | undefined): NoteView {
  return (NOTE_VIEWS as readonly string[]).includes(raw ?? "")
    ? (raw as NoteView)
    : DEFAULT_NOTE_VIEW;
}

export const NOTE_ORDERINGS = [
  "-updated_at",
  "updated_at",
  "-created_at",
  "title",
  "-title",
  "note_type",
  "-note_type",
  "favorite",
  "-favorite",
] as const;
export type NoteOrdering = (typeof NOTE_ORDERINGS)[number];
export const DEFAULT_NOTE_ORDERING: NoteOrdering = "-updated_at";

/**
 * Sort keys mirror `NoteViewSet.SORTABLE_FIELDS` in the Django backend. A key
 * outside that set is silently dropped by the viewset, which would leave the
 * UI showing "sorted by X" while the list is in its default order.
 */
export function parseNoteOrdering(raw: string | undefined): NoteOrdering {
  return (NOTE_ORDERINGS as readonly string[]).includes(raw ?? "")
    ? (raw as NoteOrdering)
    : DEFAULT_NOTE_ORDERING;
}
