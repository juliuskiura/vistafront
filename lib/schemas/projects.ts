import { z } from "zod";

/**
 * Project-manager validation contracts.
 *
 * One Zod schema per Server Action payload. The schema is the single source
 * of truth: the Server Action validates with it, the form renders its field
 * errors, and the API wrapper sends the parsed result unchanged — the field
 * names match the Django serializer fields, so nothing is renamed on the way
 * out.
 *
 * Lives in a `*.ts` file so both Server Actions (`"use server"`) and Client
 * Components can import it.
 */

/* ──────────────────────────────────────────────────────────────────────
 * Shared enums
 * ────────────────────────────────────────────────────────────────────── */

export const ProjectStatusSchema = z.enum([
  "planning",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
]);
export type ProjectStatusInput = z.infer<typeof ProjectStatusSchema>;

export const ProjectPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);
export type ProjectPriorityInput = z.infer<typeof ProjectPrioritySchema>;

export const TaskStatusSchema = z.enum(["todo", "in_progress", "done"]);
export type TaskStatusInput = z.infer<typeof TaskStatusSchema>;

export const DeliverableStatusSchema = z.enum([
  "draft",
  "review",
  "revisions",
  "approved",
  "published",
  "cancelled",
]);
export type DeliverableStatusInput = z.infer<typeof DeliverableStatusSchema>;

/**
 * A free-text field that may be left empty.
 *
 * An empty string is *not* the same as "absent" on the wire: the backend's
 * `SlugRelatedField`s want `null` to clear a relation, and an empty string
 * would fail validation. The action converts; the schema only checks shape.
 */
const optionalText = (max = 200) =>
  z
    .string()
    .max(max, `Must be ${max} characters or fewer.`)
    .optional()
    .default("");

const optionalLongText = (max = 20000) =>
  z
    .string()
    .max(max, `Must be ${max} characters or fewer.`)
    .optional()
    .default("");

/** `YYYY-MM-DD` from an `<input type="date">`, or empty when unset. */
const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.")
  .optional()
  .default("");

/* ──────────────────────────────────────────────────────────────────────
 * Project
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Creating a project.
 *
 * `company` is a company **nanoid** and `client` an optional contact
 * **nanoid**; `category` is the category **key** (`social`, `blog`, …),
 * never a nanoid — the backend reads it by key.
 */
export const CreateProjectSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  name: z.string().trim().min(1, "Project name is required.").max(255),
  description: optionalLongText(),
  company: z.string().min(1, "Company is required."),
  client: optionalText(),
  category: optionalText(50),
  status: ProjectStatusSchema.default("planning"),
  priority: ProjectPrioritySchema.default("medium"),
  start_date: optionalDate,
  deadline: optionalDate,
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

/**
 * Updating a project.
 *
 * The same fields as create, plus the project's nanoid. Every field stays
 * optional in the sense that the form always sends all of them — the
 * difference is that an update may legitimately clear a relation, which the
 * create form may not.
 */
export const UpdateProjectSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing project."),
  name: z.string().trim().min(1, "Project name is required.").max(255),
  description: optionalLongText(),
  company: z.string().min(1, "Company is required."),
  client: optionalText(),
  category: optionalText(50),
  status: ProjectStatusSchema.default("planning"),
  priority: ProjectPrioritySchema.default("medium"),
  start_date: optionalDate,
  deadline: optionalDate,
});
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

/**
 * A project status change on its own.
 *
 * The record header's status dropdown PATCHes `status` and nothing else, so
 * the payload is deliberately tiny: a crafted request cannot smuggle a
 * different column into the same call.
 */
export const UpdateProjectStatusSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing project."),
  status: ProjectStatusSchema,
});
export type UpdateProjectStatusInput = z.infer<typeof UpdateProjectStatusSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Task
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Creating a task.
 *
 * There is no `project` field: the backend derives a task's project from
 * its **deliverable** (`Task.project` is a read-only serializer method), so
 * a task belongs to a project only through the deliverable it hangs off.
 */
export const CreateTaskSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  title: z.string().trim().min(1, "Title is required.").max(255),
  description: optionalLongText(),
  deliverable: optionalText(),
  assignee: optionalText(),
  status: TaskStatusSchema.default("todo"),
  priority: ProjectPrioritySchema.default("medium"),
  due_date: optionalDate,
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing task."),
  title: z.string().trim().min(1, "Title is required.").max(255),
  description: optionalLongText(),
  deliverable: optionalText(),
  assignee: optionalText(),
  status: TaskStatusSchema.default("todo"),
  priority: ProjectPrioritySchema.default("medium"),
  due_date: optionalDate,
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

/** A task's status change on its own — the status control on a task row. */
export const UpdateTaskStatusSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing task."),
  status: TaskStatusSchema,
});
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Deliverable
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Creating a deliverable.
 *
 * `project` is a project nanoid, `deliverable_type` is a type **key**
 * (`blog_post`, …) and `assigned_to` is a user nanoid.
 */
export const CreateDeliverableSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  project: z.string().min(1, "Missing project."),
  title: z.string().trim().min(1, "Title is required.").max(255),
  description: optionalLongText(),
  deliverable_type: optionalText(50),
  status: DeliverableStatusSchema.default("draft"),
  due_date: optionalDate,
  assigned_to: optionalText(),
});
export type CreateDeliverableInput = z.infer<typeof CreateDeliverableSchema>;

export const UpdateDeliverableSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing deliverable."),
  title: z.string().trim().min(1, "Title is required.").max(255),
  description: optionalLongText(),
  deliverable_type: optionalText(50),
  status: DeliverableStatusSchema.default("draft"),
  due_date: optionalDate,
  assigned_to: optionalText(),
});
export type UpdateDeliverableInput = z.infer<typeof UpdateDeliverableSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Review workflow
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Approving a deliverable, or asking for revisions.
 *
 * Both write `review_notes` onto the deliverable. Notes are optional for an
 * approval (the legacy dialog allowed approving with an empty note) and
 * required for a revision request — the whole point of asking for
 * revisions is telling the author what to change.
 */
export const ReviewSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing deliverable."),
  review_notes: optionalLongText(5000),
});
export type ReviewInput = z.infer<typeof ReviewSchema>;

export const RequestRevisionsSchema = ReviewSchema.extend({
  review_notes: z
    .string()
    .trim()
    .min(1, "Say what needs to change.")
    .max(5000, "Must be 5000 characters or fewer."),
});
export type RequestRevisionsInput = z.infer<typeof RequestRevisionsSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Merge
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Merging two or more tasks into one.
 *
 * The merge **deletes** the source rows, so the ids are part of the
 * contract: the action validates that at least two were selected before it
 * calls the backend.
 */
export const MergeTasksSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  task_ids: z.array(z.string().min(1)).min(2, "Select at least two tasks."),
  title: z.string().trim().min(1, "Title is required.").max(255),
  description: optionalLongText(),
});
export type MergeTasksInput = z.infer<typeof MergeTasksSchema>;

export const MergeDeliverablesSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  deliverable_ids: z
    .array(z.string().min(1))
    .min(2, "Select at least two deliverables."),
  title: z.string().trim().min(1, "Title is required.").max(255),
  description: optionalLongText(),
  deliverable_type: optionalText(50),
});
export type MergeDeliverablesInput = z.infer<typeof MergeDeliverablesSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Comments
 * ────────────────────────────────────────────────────────────────────── */

/**
 * A comment on a project manager record.
 *
 * `target_type` is the backend's short name for the model — `project`,
 * `deliverable` or `task` — not an app-qualified label.
 */
export const CreateCommentSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  target_type: z.enum(["project", "deliverable", "task"]),
  target_nanoid: z.string().min(1, "Missing record."),
  text: z.string().trim().min(1, "Write something first.").max(10000),
});
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
