import { serverFetch, serverMutate } from "./server-fetch";
import type {
  Paginated,
  PlanFeature,
  PlanFeatureFormInput,
  PlanFeatureUpdateInput,
  Subscription,
  CurrentSubscription,
  RegistryFeature,
  SubscriptionCreateInput,
  SubscriptionUpdateInput,
  SubsPlan,
} from "./types";

// ── Subscriptions ───────────────────────────────────────────────────────────
// The subscriptions domain is separate from billing: plans, their features and
// organization subscriptions all live under `/apis/subscriptions/...`. Billing
// (`lib/api/billing.ts`) only owns invoices, payments and payment methods.

/**
 * Get all subscriptions
 */
export async function listSubscriptions(): Promise<Subscription[]> {
  const payload = await serverFetch<Paginated<Subscription> | Subscription[]>("/apis/subscriptions/all/");
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

/**
 * Get a single subscription by nanoid
 */
export async function getSubscription(nanoid: string): Promise<Subscription | null> {
  const payload = await serverFetch<Subscription>(
    `/apis/subscriptions/all/${nanoid}/`
  );
  return payload;
}

/**
 * Get the active workspace's own subscription (customer-facing).
 *
 * Resolved from the request's `X-Workspace`, backed by the workspace-scoped
 * `/apis/subscription/current/` endpoint.
 */
export async function getCurrentSubscription({
  workspace,
}: {
  workspace: string;
}): Promise<CurrentSubscription | null> {
  return serverFetch<CurrentSubscription>("/apis/subscription/current/", {
    workspace,
  });
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  body: SubscriptionCreateInput,
): Promise<Subscription> {
  return serverMutate<Subscription>("/apis/subscriptions/all/", {
    method: "POST",
    body,
  });
}

/**
 * Update a subscription
 */
export async function updateSubscription(
  nanoid: string,
  body: SubscriptionUpdateInput,
): Promise<Subscription> {
  return serverMutate<Subscription>(`/apis/subscriptions/all/${nanoid}/`, {
    method: "PATCH",
    body,
  });
}

/**
 * Delete a subscription
 */
export async function deleteSubscription(nanoid: string): Promise<void> {
  await serverMutate<void>(`/apis/subscriptions/all/${nanoid}/`, {
    method: "DELETE",
    body: {},
  });
}

// ── Plans ───────────────────────────────────────────────────────────────────

/**
 * Get all plans
 */
export async function listPlans(): Promise<SubsPlan[]> {
  const payload = await serverFetch<Paginated<SubsPlan> | SubsPlan[]>("/apis/subscriptions/plans/");
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

/**
 * Get a single plan by nanoid
 */
export async function getPlan(nanoid: string): Promise<SubsPlan | null> {
  const payload = await serverFetch<SubsPlan>(
    `/apis/subscriptions/plans/${nanoid}/`
  );
  return payload;
}

/**
 * Create a new plan
 */
export async function createPlan(
  body: Partial<SubsPlan> & { slug?: string },
): Promise<SubsPlan> {
  return serverMutate<SubsPlan>("/apis/subscriptions/plans/", {
    method: "POST",
    body,
  });
}

/**
 * Update a plan
 */
export async function updatePlan(
  nanoid: string,
  body: Partial<SubsPlan>,
): Promise<SubsPlan> {
  return serverMutate<SubsPlan>(`/apis/subscriptions/plans/${nanoid}/`, {
    method: "PATCH",
    body,
  });
}

/**
 * Delete a plan
 */
export async function deletePlan(nanoid: string): Promise<void> {
  await serverMutate<void>(`/apis/subscriptions/plans/${nanoid}/`, {
    method: "DELETE",
    body: {},
  });
}

// ── Plan features ───────────────────────────────────────────────────────────

/**
 * Get all features
 */
export async function listFeatures(): Promise<PlanFeature[]> {
  const payload = await serverFetch<Paginated<PlanFeature> | PlanFeature[]>("/apis/subscriptions/features/");
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

/**
 * List every feature registered in the backend's subscription registry.
 *
 * Read-only and not stored in the database — the endpoint returns a plain
 * array (no pagination envelope). `key` is what a `PlanFeature` stores.
 */
export async function listRegistryFeatures(): Promise<RegistryFeature[]> {
  const payload = await serverFetch<
    RegistryFeature[] | Paginated<RegistryFeature>
  >("/apis/subscriptions/feature-registry/");
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

/**
 * Get a single feature by nanoid
 */
export async function getFeature(nanoid: string): Promise<PlanFeature | null> {
  const payload = await serverFetch<PlanFeature>(
    `/apis/subscriptions/features/${nanoid}/`
  );
  return payload;
}

/**
 * Create a feature on a plan
 */
export async function createPlanFeature(
  body: PlanFeatureFormInput,
): Promise<PlanFeature> {
  return serverMutate<PlanFeature>("/apis/subscriptions/features/", {
    method: "POST",
    body,
  });
}

/**
 * Update a feature by nanoid
 */
export async function updatePlanFeature(
  nanoid: string,
  body: PlanFeatureUpdateInput,
): Promise<PlanFeature> {
  return serverMutate<PlanFeature>(`/apis/subscriptions/features/${nanoid}/`, {
    method: "PATCH",
    body,
  });
}

/**
 * Delete a feature by nanoid
 */
export async function deletePlanFeature(nanoid: string): Promise<void> {
  await serverMutate<void>(`/apis/subscriptions/features/${nanoid}/`, {
    method: "DELETE",
    body: {},
  });
}