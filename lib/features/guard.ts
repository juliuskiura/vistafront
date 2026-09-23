"use server";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getSubscriptionState, type Workspace } from "@/lib/api";
import { deriveFeatureState, type FeatureState } from "@/lib/features/derived";

/**
 * Fetch the subscription contract once per server request.
 *
 * The layout and every nested page guard share one fetch per render pass
 * (the same shape as `getWorkspacesForUser` in `lib/auth/server.ts`).
 */
export const getSubscriptionStateCached = cache(
  async (workspace: string) => getSubscriptionState({ workspace }),
);

/**
 * Server route/UI guard for a feature-declaring route.
 *
 * Reads the (cached) subscription state and, when the feature is not
 * currently usable, redirects to the access page with the right mode. This
 * is NOT access control — Django still 403s every API call. When the feature
 * is available it returns the derived state so the page can render.
 */
export async function requireFeature(
  active: Pick<Workspace, "domain" | "nanoid">,
  feature: string,
): Promise<FeatureState> {
  let state;
  try {
    state = await getSubscriptionStateCached(active.nanoid);
  } catch {
    // Falling back to an empty contract keeps the guard from ever opening a
    // hole: nothing is owned → the feature is unavailable, same as Django's
    // 403 for a workspace with no subscription.
    state = { subscription: null, features: [], exempt: false };
  }

  const derived = deriveFeatureState(state, feature);

  if (derived === "locked") {
    redirect(
      `/${active.domain}/dashboard/subscription/access?mode=locked&feature=${encodeURIComponent(feature)}`,
    );
  }

  if (derived === "unavailable") {
    redirect(
      `/${active.domain}/dashboard/subscription/access?mode=upgrade&feature=${encodeURIComponent(feature)}`,
    );
  }

  return derived;
}