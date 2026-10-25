import { z, flattenError } from "zod";

/**
 * Reference Zod schemas + helpers for React Hook Form + Server Action
 * integration. The same schema is consumed by:
 *
 *   1. The Server Action (server-side validation, source of truth).
 *   2. The RHF form (client-side live validation via `zodResolver`).
 *
 * Field names match the Django serializer fields in the backend, so a
 * `safeParse`'d payload can be sent straight to `serverMutate` without
 * renaming. Keep the schema in `*.ts` so it can be imported from both
 * Server Actions (`*.ts`, `"use server"`) and Client Components
 * (`*.tsx`, `"use client"`).
 */

/* ──────────────────────────────────────────────────────────────────────
 * Invite members
 * ────────────────────────────────────────────────────────────────────── */

export const InviteSchema = z.object({
  workspace: z.string().min(1, "Missing workspace."),
  email: z.string().email("Enter a valid email address."),
  first_name: z.string().min(1, "First name is required.").max(80),
  last_name: z.string().min(1, "Last name is required.").max(80),
  role: z.enum(["admin", "member"]).default("member"),
});
export type InviteInput = z.infer<typeof InviteSchema>;

/** Convert a Zod `safeParse` failure into the `{fieldErrors}` shape
 * `useActionState` and RHF both consume. */
export function fieldErrorsFromZod(
  err: z.ZodError,
): Record<string, string[] | undefined> {
  return flattenError(err).fieldErrors;
}

/* ──────────────────────────────────────────────────────────────────────
 * Note (Notebook)
 * ────────────────────────────────────────────────────────────────────── */

export const NewNoteSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  title: z.string().min(1, "Title is required.").max(200),
  note_type: z.string().min(1).default("general"),
  tags: z.string().optional(), // comma-separated; split in the action
  content: z.string().optional(), // JSON-encoded rich-text blob
});
export type NewNoteInput = z.infer<typeof NewNoteSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Company (CRM)
 *
 * The CRM validation contracts live in their own module — `crm.ts` — so the
 * file stays readable. They are re-exported here so `@/lib/schemas` remains
 * the single import path for every schema in the app.
 * ────────────────────────────────────────────────────────────────────── */

export {
  ConnectNoteSchema,
  CreateActivitySchema,
  CreateContactSchema,
  CreateDealSchema,
  CreateIndustrySchema,
  CreateLeadSchema,
  CreateObservationSchema,
  CreatePipelineSchema,
  CreatePipelineStageSchema,
  CreateTierClassificationSchema,
  BulkCompanyActionSchema,
  ContactStatusSchema,
  MoveDealSchema,
  NewCompanySchema,
  ProspectStatusSchema,
  SocialLinkSchema,
  UpdateActivitySchema,
  UpdateCompanyFieldSchema,
  UpdateCompanySocialLinksSchema,
  UpdateContactSchema,
  UpdateDealSchema,
  UpdateTierClassificationSchema,
  type ConnectNoteInput,
  type BulkCompanyActionInput,
  type CreateActivityInput,
  type CreateContactInput,
  type CreateDealInput,
  type CreateIndustryInput,
  type CreateLeadInput,
  type CreateObservationInput,
  type CreatePipelineInput,
  type CreatePipelineStageInput,
  type CreateTierClassificationInput,
  type MoveDealInput,
  type NewCompanyInput,
  type ProspectStatusInput,
  type SocialLinkInput,
  type UpdateActivityInput,
  type UpdateCompanyFieldInput,
  type UpdateCompanySocialLinksInput,
  type UpdateContactInput,
  type UpdateDealInput,
  type UpdateTierClassificationInput,
} from "./crm";

/* ──────────────────────────────────────────────────────────────────────
 * Project manager
 *
 * The project / task validation contracts live in their own
 * module — `projects.ts` — so the file stays readable. They are re-exported
 * here so `@/lib/schemas` remains the single import path for every schema
 * in the app.
 * ────────────────────────────────────────────────────────────────────── */

export {
  CreateCommentSchema,
  CreateProjectSchema,
  CreateTaskSchema,
  MergeTasksSchema,
  ProjectPrioritySchema,
  ProjectStatusSchema,
  TaskStatusSchema,
  UpdateProjectSchema,
  UpdateProjectStatusSchema,
  UpdateTaskSchema,
  UpdateTaskStatusSchema,
  type CreateCommentInput,
  type CreateProjectInput,
  type CreateTaskInput,
  type MergeTasksInput,
  type ProjectPriorityInput,
  type ProjectStatusInput,
  type TaskStatusInput,
  type UpdateProjectInput,
  type UpdateProjectStatusInput,
  type UpdateTaskInput,
  type UpdateTaskStatusInput,
} from "./projects";