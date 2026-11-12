import { z } from "zod";

/**
 * Developer console validation contracts.
 *
 * One Zod schema per Server Action payload. The schema is the single source
 * of truth: the Server Action validates with it, the form renders its field
 * errors, and the API wrapper sends the parsed result unchanged.
 *
 * Lives in a `*.ts` file so both Server Actions (`"use server"`) and Client
 * Components can import it.
 */

/* ──────────────────────────────────────────────────────────────────────
 * Create application
 * ────────────────────────────────────────────────────────────────────── */

export const CreateApplicationSchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  application_name: z
    .string()
    .min(1, "Application name is required.")
    .max(255, "Name must be 255 characters or fewer."),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or fewer.")
    .optional()
    .default(""),
  scopes: z
    .array(z.string())
    .default([])
    .refine(
      (val) => val.length === 0 || val.every((s) => s.length > 0),
      "Scopes must not contain empty strings.",
    ),
  is_active: z.boolean().default(true),
});
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Create API key
 * ────────────────────────────────────────────────────────────────────── */

export const CreateKeySchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  application_nanoid: z.string().min(1, "Missing application."),
  expires_at: z.string().optional().nullable(),
});
export type CreateKeyInput = z.infer<typeof CreateKeySchema>;

/* ──────────────────────────────────────────────────────────────────────
 * Revoke API key
 * ────────────────────────────────────────────────────────────────────── */

export const RevokeKeySchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  key_nanoid: z.string().min(1, "Missing key."),
});
export type RevokeKeyInput = z.infer<typeof RevokeKeySchema>;
