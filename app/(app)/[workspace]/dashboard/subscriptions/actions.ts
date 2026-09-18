"use server";

import { revalidatePath } from "next/cache";
import { z, flattenError } from "zod";

import type { ActionState } from "./action-state";
import {
  createPlan,
  createPlanFeature,
  createSubscription,
  deletePlan,
  deletePlanFeature,
  deleteSubscription,
  updatePlan,
  updatePlanFeature,
  updateSubscription,
} from "@/lib/api";

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

const priceField = z
  .preprocess(
    (v) => {
      if (v === "" || v == null) return null;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : null;
    },
    z.union([z.number().min(0), z.null()]),
  )
  .default(null);

const PlanUpsertSchema = z.object({
  nanoid: z.string().optional(),
  name: z.string().trim().min(1, "Name is required.").max(80),
  label: z.string().trim().min(1, "Label is required.").max(80),
  description: z.string().trim().default(""),
  order: orderField,
  is_active: boolField,
  price: priceField,
});
export type PlanUpsertInput = z.infer<typeof PlanUpsertSchema>;

const SubscriptionCreateSchema = z.object({
  client_business: z.string().min(1, "Select an organization."),
  plan: z.string().min(1, "Select a plan."),
  status: z.enum(["active", "past_due", "cancelled"]).default("active"),
  cancel_at_period_end: boolField,
});
export type SubscriptionCreateInput = z.infer<typeof SubscriptionCreateSchema>;

const SubscriptionUpdateSchema = z.object({
  nanoid: z.string().min(1, "Missing subscription."),
  plan: z.string().min(1, "Select a plan."),
  status: z.enum(["active", "past_due", "cancelled"]).default("active"),
  cancel_at_period_end: boolField,
});
export type SubscriptionUpdateInput = z.infer<typeof SubscriptionUpdateSchema>;

// ── Plan create / update ────────────────────────────────────────────────────

function planPayload(parsed: PlanUpsertInput) {
  return {
    name: parsed.name,
    label: parsed.label,
    description: parsed.description,
    order: parsed.order,
    is_active: parsed.is_active,
    price: parsed.price,
  };
}

export async function createPlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = PlanUpsertSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    await createPlan(planPayload(parsed.data));
  } catch (error) {
    console.error("createPlanAction failed:", error);
    return {
      status: "error",
      message:
        "We could not create the plan. A plan with this name may already exist, or the server may be unavailable.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: `Plan "${parsed.data.label}" created.` };
}

export async function updatePlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = PlanUpsertSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  if (!parsed.data.nanoid) {
    return { status: "error", message: "Missing plan reference." };
  }

  try {
    await updatePlan(parsed.data.nanoid, planPayload(parsed.data));
  } catch (error) {
    console.error("updatePlanAction failed:", error);
    return {
      status: "error",
      message:
        "We could not update the plan. The name may conflict with another plan, or the server may be unavailable.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: `Plan "${parsed.data.label}" updated.` };
}

export async function deletePlanAction(
  nanoid: string,
): Promise<PlanActionResult> {
  try {
    await deletePlan(nanoid);
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

// ── Plan features ───────────────────────────────────────────────────────────

const PlanFeatureSchema = z.object({
  plan: z.string().optional(),
  nanoid: z.string().optional(),
  feature: z.string().trim().min(1, "Feature text is required.").max(60),
  description: z.string().trim().default(""),
});

export async function upsertPlanFeatureAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = PlanFeatureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const { plan, nanoid, feature, description } = parsed.data;

  if (nanoid) {
    try {
      await updatePlanFeature(nanoid, {
        feature,
        description: description || undefined,
      });
    } catch (error) {
      console.error("upsertPlanFeatureAction (update) failed:", error);
      return {
        status: "error",
        message:
          "Could not save the feature. This plan may already have a feature with that text.",
      };
    }
    revalidatePath("/", "layout");
    return { status: "success", message: `Feature "${feature}" updated.` };
  }

  if (!plan) {
    return { status: "error", message: "Missing plan reference." };
  }

  try {
    await createPlanFeature({
      plan,
      feature,
      description: description || undefined,
    });
  } catch (error) {
    console.error("upsertPlanFeatureAction (create) failed:", error);
    return {
      status: "error",
      message:
        "Could not add the feature. This plan may already have a feature with that text.",
    };
  }
  revalidatePath("/", "layout");
  return { status: "success", message: `Feature "${feature}" added.` };
}

export async function deletePlanFeatureAction(
  nanoid: string,
): Promise<PlanActionResult> {
  try {
    await deletePlanFeature(nanoid);
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

  try {
    await createSubscription({
      client_business: parsed.data.client_business,
      plan: parsed.data.plan,
      status: parsed.data.status,
      cancel_at_period_end: parsed.data.cancel_at_period_end,
    });
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

  try {
    await updateSubscription(parsed.data.nanoid, {
      plan: parsed.data.plan,
      status: parsed.data.status,
      cancel_at_period_end: parsed.data.cancel_at_period_end,
    });
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
  nanoid: string,
): Promise<PlanActionResult> {
  try {
    await deleteSubscription(nanoid);
  } catch (error) {
    console.error("deleteSubscriptionAction failed:", error);
    return { ok: false, error: "Could not delete the subscription." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}