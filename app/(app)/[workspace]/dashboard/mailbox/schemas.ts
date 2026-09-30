import { z } from "zod";

/**
 * Zod is the single validation contract for every mailbox form. The schemas
 * live in a `*.ts` (not `*.tsx`) so both the Server Action and the client form
 * import the same one — no drift between what the browser allows and what the
 * server accepts.
 */

const emailList = z
  .string()
  .transform((raw) =>
    raw
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().email("Enter a valid email address.")));

export const SendEmailSchema = z.object({
  workspace: z.string().min(1, "Missing workspace."),
  mailbox_id: z.string().min(1, "Choose a mailbox to send from."),
  to: emailList.pipe(z.array(z.string()).min(1, "Add at least one recipient.")),
  cc: emailList,
  bcc: emailList,
  subject: z
    .string()
    .trim()
    .min(1, "A subject is required.")
    .max(998, "Subject is too long."),
  body_text: z.string().default(""),
  body_html: z.string().default(""),
  in_reply_to: z.string().optional(),
  signature_included: z.coerce.boolean().default(false),
  scheduled_at: z.string().optional(),
});

export const SaveDraftSchema = z.object({
  workspace: z.string().min(1, "Missing workspace."),
  mailbox_id: z.string().min(1, "Choose a mailbox."),
  email_id: z.string().optional(),
  to: emailList,
  cc: emailList,
  bcc: emailList,
  subject: z.string().trim().min(1, "A subject is required.").max(998),
  body_text: z.string().default(""),
  body_html: z.string().default(""),
  in_reply_to: z.string().optional(),
});

export const MailboxCreateSchema = z
  .object({
    workspace: z.string().min(1, "Missing workspace."),
    email_address: z.string().trim().email("Enter a valid email address."),
    domain: z.string().trim().min(1, "Domain is required."),
    domain_config: z.string().optional(),
    display_name: z.string().trim().max(120).default(""),
    password: z.string().min(8, "Use at least 8 characters."),
    confirm_password: z.string().min(1, "Confirm the password."),
    email_template: z.enum(["none", "premium"]).default("none"),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match.",
  });

export const MailboxUpdateSchema = z.object({
  workspace: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing mailbox."),
  display_name: z.string().trim().max(120).optional(),
  is_active: z.coerce.boolean().optional(),
  email_template: z.enum(["none", "premium"]).optional(),
  password: z.string().optional(),
  confirm_password: z.string().optional(),
});

export const DomainConfigSchema = z.object({
  workspace: z.string().min(1, "Missing workspace."),
  domain: z.string().trim().min(1, "Domain is required."),
  s3_bucket: z.string().trim().min(1, "S3 bucket is required."),
  aws_access_key_id: z.string().trim().min(1, "Access key ID is required."),
  aws_secret_access_key: z.string().trim().min(1, "Secret access key is required."),
  aws_ses_region_name: z.string().trim().min(1, "SES region is required."),
  provider: z.string().trim().min(1, "Provider is required."),
});

export const MoveEmailSchema = z.object({
  workspace: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing email."),
  folder: z.string().min(1, "Choose a destination folder."),
});

export const ReorderFoldersSchema = z.object({
  workspace: z.string().min(1, "Missing workspace."),
  mailbox_id: z.string().min(1, "Missing mailbox."),
  ordered_ids: z.array(z.string()).min(1),
});

export const SignatureSchema = z.object({
  workspace: z.string().min(1, "Missing workspace."),
  mailbox: z.string().min(1, "Missing mailbox."),
  is_enabled: z.coerce.boolean().default(true),
  display_name: z.string().trim().max(120).default(""),
  title: z.string().trim().max(120).default(""),
  company: z.string().trim().max(120).default(""),
  company_tagline: z.string().trim().max(200).default(""),
  phone: z.string().trim().max(40).default(""),
  website_url: z.string().trim().max(200).default(""),
  email_address: z.string().trim().max(200).default(""),
  address: z.string().trim().max(300).default(""),
  linkedin_url: z.string().trim().max(200).default(""),
  twitter_url: z.string().trim().max(200).default(""),
  facebook_url: z.string().trim().max(200).default(""),
  instagram_url: z.string().trim().max(200).default(""),
  registration_number: z.string().trim().max(80).default(""),
  vat_number: z.string().trim().max(80).default(""),
  registered_office: z.string().trim().max(200).default(""),
  theme_color: z.string().trim().max(20).default("#2563eb"),
  logo_url: z.string().trim().max(500).optional(),
  logo_width: z.coerce.number().int().min(40).max(400).default(120),
});

export type SendEmailInput = z.infer<typeof SendEmailSchema>;
export type SaveDraftInput = z.infer<typeof SaveDraftSchema>;
export type MailboxCreateInput = z.infer<typeof MailboxCreateSchema>;
export type DomainConfigInput = z.infer<typeof DomainConfigSchema>;
export type SignatureInput = z.infer<typeof SignatureSchema>;
