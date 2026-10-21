import { z } from "zod";

/**
 * CRM validation contracts.
 *
 * One Zod schema per Server Action payload. The schema is the single source
 * of truth: the Server Action validates with it, the form renders its
 * field errors, and the API wrapper sends the parsed result unchanged —
 * field names match the Django serializer fields, so nothing is renamed on
 * the way out.
 *
 * Lives in a `*.ts` file so both Server Actions (`"use server"`) and Client
 * Components can import it.
 */

/* ──────────────────────────────────────────────────────────────────────
 * Shared building blocks
 * ────────────────────────────────────────────────────────────────────── */

export const ProspectStatusSchema = z.enum([
  "identified",
  "researching",
  "contact_ready",
  "outreach_sent",
  "engaged",
  "qualified",
  "customer",
  "lost",
]);
export type ProspectStatusInput = z.infer<typeof ProspectStatusSchema>;

export const SocialLinkSchema = z.object({
  url: z.string().min(1, "URL or phone number is required."),
  name: z.string().optional(),
  is_primary: z.boolean().optional(),
});
export type SocialLinkInput = z.infer<typeof SocialLinkSchema>;

export const ContactStatusSchema = z.enum(["active", "inactive", "lead"]);

/* ──────────────────────────────────────────────────────────────────────
 * Company
 * ────────────────────────────────────────────────────────────────────── */

/**
 * A single company field, saved on its own.
 *
 * The company record edits one field at a time, so the payload is
 * `{ field, value }` rather than a partial record: the action can then
 * whitelist the field name against the set the backend accepts, and a
 * crafted request cannot smuggle in a different column.
 */
export const UpdateCompanyFieldSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing company."),
  field: z.enum([
    "name",
    "domain",
    "email",
    "size",
    "country",
    "city",
    "address",
    "industry",
    "tier",
    "verified",
    "total_listings",
    "status",
    "about",
    "phone_numbers",
    "social_links",
  ]),
  /** The new value, as a string. Cast per field by the action. */
  value: z.string(),
});
export type UpdateCompanyFieldInput = z.infer<typeof UpdateCompanyFieldSchema>;

/**
 * The company's social channels, saved as a whole list.
 *
 * The inline channel editor on the record sends the complete list — one
 * entry per channel — because the backend keeps the channels in a single
 * JSON column. The company is addressed by its nanoid.
 */
export const UpdateCompanySocialLinksSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing company."),
  links: z.array(SocialLinkSchema).max(50, "Too many channels."),
});
export type UpdateCompanySocialLinksInput = z.infer<
  typeof UpdateCompanySocialLinksSchema
>;

export const NewCompanySchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  name: z.string().min(1, "Company name is required.").max(200),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  tier: z.string().nullable().optional(),
  phone_numbers: z.array(z.string()).optional(),
  social_links: z.array(SocialLinkSchema).optional(),
  email: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  about: z.string().optional(),
  status: ProspectStatusSchema.default("identified"),
  verified: z.boolean().optional(),
  total_listings: z
    .number()
    .int("Must be a whole number.")
    .min(0, "Must be zero or greater.")
    .optional(),
});
export type NewCompanyInput = z.infer<typeof NewCompanySchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Tier classification
 * ────────────────────────────────────────────────────────────────────── */

export const CreateTierClassificationSchema = z.object({
  title: z.string().optional(),
  label: z.string().optional(),
  description: z.record(z.string(), z.unknown()).optional(),
});
export type CreateTierClassificationInput = z.infer<
  typeof CreateTierClassificationSchema
>;

export const UpdateTierClassificationSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing tier."),
  title: z.string().optional(),
  label: z.string().optional(),
  description: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateTierClassificationInput = z.infer<
  typeof UpdateTierClassificationSchema
>;

/* ──────────────────────────────────────────────────────────────────────
 * Industry
 * ────────────────────────────────────────────────────────────────────── */

export const CreateIndustrySchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  name: z.string().min(1, "Industry name is required.").max(255),
  description: z.string().optional(),
});
export type CreateIndustryInput = z.infer<typeof CreateIndustrySchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Observation
 * ────────────────────────────────────────────────────────────────────── */

export const CreateObservationSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  company: z.string().min(1, "Missing company."),
  category: z.string().min(1, "Choose a category."),
  title: z.string().min(1, "Title is required.").max(255),
  description: z.string().optional(),
  severity: z.coerce.number().int().min(1).max(5).optional(),
  opportunity: z.string().optional(),
});
export type CreateObservationInput = z.infer<typeof CreateObservationSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Activity
 * ────────────────────────────────────────────────────────────────────── */

export const CreateActivitySchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  company: z.string().min(1, "Missing company."),
  action_type: z.string().min(1, "Choose an action type."),
  subject: z.string().min(1, "Subject is required.").max(255),
  contact: z.string().optional(),
  /** ISO datetime. */
  due_at: z.string().optional(),
  /** The free-text body. Stored in the `content` JSON blob. */
  body: z.string().optional(),
});
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;

export const UpdateActivitySchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing activity."),
  subject: z.string().min(1, "Subject is required.").max(255),
  due_at: z.string().optional(),
  body: z.string().optional(),
  /** Toggles the `completed_at` stamp. */
  completed: z.boolean().optional(),
});
export type UpdateActivityInput = z.infer<typeof UpdateActivitySchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Lead
 * ────────────────────────────────────────────────────────────────────── */

export const CreateLeadSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  company: z.string().min(1, "Missing company."),
  contact: z.string().optional(),
  source: z.string().min(1, "Source is required.").max(100),
  status: z.string().min(1, "Status is required.").max(50),
  notes: z.string().optional(),
});
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Contact
 * ────────────────────────────────────────────────────────────────────── */

export const CreateContactSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  first_name: z.string().min(1, "First name is required.").max(255),
  last_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  company: z.string().min(1, "Missing company."),
  notes: z.string().optional(),
  status: ContactStatusSchema.default("active"),
  social_links: z.array(SocialLinkSchema).optional(),
});
export type CreateContactInput = z.infer<typeof CreateContactSchema>;

export const UpdateContactSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing contact."),
  first_name: z.string().min(1, "First name is required.").max(255),
  last_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  status: ContactStatusSchema.optional(),
  social_links: z.array(SocialLinkSchema).optional(),
});
export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Pipeline, stage and deal
 * ────────────────────────────────────────────────────────────────────── */

export const CreatePipelineSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  name: z.string().min(1, "Pipeline name is required.").max(255),
  description: z.string().optional(),
  /** The stage names to create alongside the pipeline, in order. */
  stages: z.array(z.string().min(1)).min(1, "Add at least one stage.").optional(),
});
export type CreatePipelineInput = z.infer<typeof CreatePipelineSchema>;

export const CreatePipelineStageSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  pipeline: z.string().min(1, "Missing pipeline."),
  name: z.string().min(1, "Stage name is required.").max(255),
  order: z.coerce.number().int().min(0),
});
export type CreatePipelineStageInput = z.infer<
  typeof CreatePipelineStageSchema
>;

export const CreateDealSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  title: z.string().min(1, "Deal title is required.").max(255),
  value: z.coerce.number().min(0, "Value cannot be negative.").optional(),
  pipeline: z.string().min(1, "Missing pipeline."),
  stage: z.string().min(1, "Missing stage."),
  contact: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(["open", "won", "lost"]).default("open"),
  expected_close_date: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateDealInput = z.infer<typeof CreateDealSchema>;

export const UpdateDealSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing deal."),
  title: z.string().min(1, "Deal title is required.").max(255),
  value: z.coerce.number().min(0, "Value cannot be negative.").optional(),
  stage: z.string().min(1, "Missing stage.").optional(),
  contact: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(["open", "won", "lost"]).optional(),
  expected_close_date: z.string().optional(),
  notes: z.string().optional(),
});
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;

export const MoveDealSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing deal."),
  stage: z.string().min(1, "Missing stage."),
});
export type MoveDealInput = z.infer<typeof MoveDealSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Note relation
 * ────────────────────────────────────────────────────────────────────── */

export const ConnectNoteSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  note: z.string().min(1, "Missing note."),
  relatable_nanoid: z.string().min(1, "Missing record type."),
  object_nanoid: z.string().min(1, "Missing record."),
});
export type ConnectNoteInput = z.infer<typeof ConnectNoteSchema>;
