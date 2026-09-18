"use server";

import { revalidatePath } from "next/cache";
import { z, flattenError } from "zod";

import type { ActionState } from "./action-state";
import {
  createPlanFeature,
  createPlanFeatures,
  deletePlanFeature,
  listRegistryFeatures,
  updatePlanFeature,
} from "@/lib/api";

export type PlanActionResult = { ok: boolean; error?: string };

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

// ── Plan features (bulk add) ────────────────────────────────────────────────

const AddPlanFeaturesSchema = z.object({
  plan: z.string().min(1, "Missing plan reference."),
  feature: z.array(z.string().trim().min(1)).min(1, "Select at least one feature."),
});

export async function addPlanFeaturesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = AddPlanFeaturesSchema.safeParse({
    plan: formData.get("plan"),
    feature: formData
      .getAll("feature")
      .map((v) => String(v).trim())
      .filter(Boolean),
  });

  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Please select at least one feature.",
      fieldErrors,
    };
  }

  const { plan } = parsed.data;
  const keys = Array.from(new Set(parsed.data.feature));

  try {
    // Resolve each key's human-facing description from the registry so the
    // plan list renders copy instead of empty text.
    const registry = await listRegistryFeatures();
    const byKey = new Map(registry.map((r) => [r.key, r]));

    await createPlanFeatures(
      keys.map((feature) => ({
        plan,
        feature,
        description: byKey.get(feature)?.description ?? "",
      })),
    );
  } catch (error) {
    console.error("addPlanFeaturesAction failed:", error);
    return {
      status: "error",
      message:
        "Could not add the features. One of them may already be on this plan.",
    };
  }

  revalidatePath("/", "layout");
  const label = keys.length === 1 ? "Feature" : "Features";
  return {
    status: "success",
    message: `${keys.length} ${label} added.`,
  };
}