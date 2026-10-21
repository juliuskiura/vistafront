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
 * New project
 * ────────────────────────────────────────────────────────────────────── */

export const ProjectPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const ProjectStatusSchema = z.enum([
  "planning",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
]);

export const NewProjectSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  name: z.string().min(1, "Project name is required.").max(200),
  company: z.string().min(1, "Company is required."),
  client: z.string().optional(),
  category: z.string().optional(),
  status: ProjectStatusSchema.default("planning"),
  priority: ProjectPrioritySchema.default("medium"),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  description: z.string().max(5000).optional(),
});
export type NewProjectInput = z.infer<typeof NewProjectSchema>;

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
  ContactStatusSchema,
  MoveDealSchema,
  NewCompanySchema,
  ProspectStatusSchema,
  SocialLinkSchema,
  UpdateActivitySchema,
  UpdateCompanyFieldSchema,
  UpdateContactSchema,
  UpdateDealSchema,
  UpdateTierClassificationSchema,
  type ConnectNoteInput,
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
  type UpdateContactInput,
  type UpdateDealInput,
  type UpdateTierClassificationInput,
} from "./crm";