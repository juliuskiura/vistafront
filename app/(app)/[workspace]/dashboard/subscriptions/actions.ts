"use server";

import { revalidatePath } from "next/cache";
import { z, flattenError } from "zod";

import {
  createPlan,
  updatePlan,
  deletePlan,
  createPlanApp,
  deletePlanApp,
  createPlanFeature,
  deletePlanFeature,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "@/lib/api";

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialActionState: ActionState = { status: "idle" };

export type PlanActionResult = { ok: boolean; error?: string };

// ── Zod schemas (the validation contract for every form) ────────────────────

const boolField = z
  .union([z.literal("on"), z.literal("off")])
  .default("off")
  .transform((v) => v === "on");

const orderField = z
  .preprocess(
    (v) => (v === "" || v == null ? 0 : Number(v)),
    z.number().int().min(0),
  )
  .default(0);

const seatLimitField = z
  .preprocess(
    (v) => {
      const n = typeof v === "string" && v !== "" ? Number(v) : null;
      return n !== null && Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
    },
    z.union([z.number().int().min(0), z.null()]),
  )
  .default(null);

const pricePerSeatField = z
  .preprocess(
    (v) => {
      const n = typeof v === "string" && v !== "" ? Number(v) : null;
      return n !== null && Number.isFinite(n) && n >= 0 ? String(n) : null;
    },
    z.union([z.string(), z.null()]),
  )
  .default(null);

export const PlanUpsertSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(40)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and dashes.",
    ),
  name: z.string().trim().min(1, "Name is required.").max(80),
  label: z.string().trim().min(1, "Label is required.").max(80),
  description: z.string().trim().default(""),
  order: orderField,
  is_active: boolField,
  seat_limit: seatLimitField,
  price_per_seat: pricePerSeatField,
  includes_enterprise_features: boolField,
});
export type PlanUpsertInput = z.infer<typeof PlanUpsertSchema>;

export const SubscriptionCreateSchema = z.object({
  client_business: z.string().min(1, "Select an organization."),
  plan: z.string().min(1, "Select a plan."),
  status: z.enum(["active", "past_due", "cancelled"]).default("active"),
  cancel_at_period_end: boolField,
});
export type SubscriptionCreateInput = z.infer<typeof SubscriptionCreateSchema>;

export const SubscriptionUpdateSchema = z.object({
  id: z.coerce.number().int().min(1, "Missing subscription."),
  plan: z.string().min(1, "Select a plan."),
  status: z.enum(["active", "past_due", "cancelled"]).default("active"),
  cancel_at_period_end: boolField,
});
export type SubscriptionUpdateInput = z.infer<typeof SubscriptionUpdateSchema>;

// ── Plan create / update ────────────────────────────────────────────────────

function parseFeatures(fd: FormData): { feature: string }[] {
  const raw = String(fd.get("feature_text") ?? "").trim();
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((feature) => ({ feature }));
}

function planPayload(parsed: PlanUpsertInput) {
  return {
    slug: parsed.slug,
    name: parsed.name,
    label: parsed.label,
    description: parsed.description,
    order: parsed.order,
    is_active: parsed.is_active,
    seat_limit: parsed.seat_limit,
    price_per_seat: parsed.price_per_seat,
    includes_enterprise_features: parsed.includes_enterprise_features,
  };
}

function parsePlanForm(fd: FormData):
  | { ok: true; data: PlanUpsertInput; features: { feature: string }[] }
  | { ok: false; fieldErrors: Record<string, string[]> } {
  const parsed = PlanUpsertSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { ok: false, fieldErrors };
  }
  return { ok: true, data: parsed.data, features: parseFeatures(fd) };
}

export async function createPlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsedForm = parsePlanForm(formData);
  if (!parsedForm.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsedForm.fieldErrors,
    };
  }

  const workspace = String(formData.get("workspace") ?? "");
  try {
    await createPlan(
      { ...planPayload(parsedForm.data), features: parsedForm.features },
      { workspace },
    );
  } catch (error) {
    console.error("createPlanAction failed:", error);
    return {
      status: "error",
      message:
        "We could not create the plan. The slug may already be taken, or the server may be unavailable.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: `Plan "${parsedForm.data.label}" created.` };
}

export async function updatePlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsedForm = parsePlanForm(formData);
  if (!parsedForm.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsedForm.fieldErrors,
    };
  }

  const workspace = String(formData.get("workspace") ?? "");
  try {
    await updatePlan(
      parsedForm.data.slug,
      { ...planPayload(parsedForm.data), features: parsedForm.features },
      { workspace },
    );
  } catch (error) {
    console.error("updatePlanAction failed:", error);
    return {
      status: "error",
      message:
        "We could not update the plan. The slug may conflict with another plan, or the server may be unavailable.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: `Plan "${parsedForm.data.label}" updated.` };
}

export async function deletePlanAction(
  slug: string,
  workspace: string,
): Promise<PlanActionResult> {
  try {
    await deletePlan(slug, { workspace });
  } catch (error) {
    console.error("deletePlanAction failed:", error);
    return {
      ok: false,
      error:
        "Could not delete the plan. Plans that are in use by a subscription cannot be removed.",
    };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Plan apps ───────────────────────────────────────────────────────────────

export async function addPlanAppAction(
  plan: string,
  appKey: string,
  featureFlag: string,
  workspace: string,
): Promise<PlanActionResult> {
  if (!appKey.trim()) return { ok: false, error: "App key is required." };
  try {
    await createPlanApp(
      { plan, app_key: appKey.trim(), feature_flag: featureFlag.trim() },
      { workspace },
    );
  } catch (error) {
    console.error("addPlanAppAction failed:", error);
    return {
      ok: false,
      error: "Could not add the app. It may already be bound to this plan.",
    };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePlanAppAction(
  id: number,
  workspace: string,
): Promise<PlanActionResult> {
  try {
    await deletePlanApp(id, { workspace });
  } catch (error) {
    console.error("deletePlanAppAction failed:", error);
    return { ok: false, error: "Could not remove the app binding." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Plan features ───────────────────────────────────────────────────────────

export async function addPlanFeatureAction(
  plan: string,
  feature: string,
  workspace: string,
): Promise<PlanActionResult> {
  if (!feature.trim()) return { ok: false, error: "Feature text is required." };
  try {
    await createPlanFeature({ plan, feature: feature.trim() }, { workspace });
  } catch (error) {
    console.error("addPlanFeatureAction failed:", error);
    return { ok: false, error: "Could not add the feature." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePlanFeatureAction(
  nanoid: string,
  workspace: string,
): Promise<PlanActionResult> {
  try {
    await deletePlanFeature(nanoid, { workspace });
  } catch (error) {
    console.error("deletePlanFeatureAction failed:", error);
    return { ok: false, error: "Could not remove the feature." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Subscriptions ───────────────────────────────────────────────────────────

export async function createSubscriptionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = SubscriptionCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const workspace = String(formData.get("workspace") ?? "");
  try {
    await createSubscription(
      {
        client_business: parsed.data.client_business,
        plan: parsed.data.plan,
        status: parsed.data.status,
        cancel_at_period_end: parsed.data.cancel_at_period_end,
      },
      { workspace },
    );
  } catch (error) {
    console.error("createSubscriptionAction failed:", error);
    return {
      status: "error",
      message:
        "We could not create the subscription. The organization may already have one, or the server may be unavailable.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Subscription created." };
}

export async function updateSubscriptionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = SubscriptionUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const workspace = String(formData.get("workspace") ?? "");
  try {
    await updateSubscription(
      parsed.data.id,
      {
        plan: parsed.data.plan,
        status: parsed.data.status,
        cancel_at_period_end: parsed.data.cancel_at_period_end,
      },
      { workspace },
    );
  } catch (error) {
    console.error("updateSubscriptionAction failed:", error);
    return {
      status: "error",
      message:
        "We could not update the subscription. The plan or period may be invalid, or the server may be unavailable.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Subscription updated." };
}

export async function deleteSubscriptionAction(
  id: number,
  workspace: string,
): Promise<PlanActionResult> {
  try {
    await deleteSubscription(id, { workspace });
  } catch (error) {
    console.error("deleteSubscriptionAction failed:", error);
    return { ok: false, error: "Could not delete the subscription." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}