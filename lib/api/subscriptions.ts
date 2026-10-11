import { serverFetch, serverMutate } from "./server-fetch";
import type {
  Paginated,
  PlanFeature,
  PlanFeatureFormInput,
  PlanFeatureUpdateInput,
  Subscription,
  SubscriptionState,
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
export async function listSubscriptions({ workspace }: { workspace?: string } = {}): Promise<Subscription[]> {
  const payload = await serverFetch<Paginated<Subscription> | Subscription[]>("/apis/subscriptions/all/", { workspace });
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

/**
 * Get a single subscription by nanoid
 */
export async function getSubscription(nanoid: string, opts: { workspace?: string } = {}): Promise<Subscription | null> {
  const payload = await serverFetch<Subscription>(
    `/apis/subscriptions/all/${nanoid}/`,
    opts,
  );
  return payload;
}

/**
 * Get the subscription capability contract for the active workspace.
 *
 * Backed by the workspace-scoped ``GET /apis/subscriptions/state/`` endpoint.
 * This is the single source of truth the app bootstraps from: Django owns the
 * facts (``active`` / ``expired`` / ``features`` / ``exempt``) and Next.js
 * only maps them to UI state.
 */
export async function getSubscriptionState({
  workspace,
}: {
  workspace: string;
}): Promise<SubscriptionState> {
  return serverFetch<SubscriptionState>("/apis/subscriptions/state/", {
    workspace,
  });
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  body: SubscriptionCreateInput,
  opts: { workspace?: string } = {},
): Promise<Subscription> {
  return serverMutate<Subscription>("/apis/subscriptions/all/", {
    method: "POST",
    body,
    ...opts,
  });
}

/**
 * Add a subscription via the viewset's purpose-built `add` action.
 *
 * Takes a plan nanoid and an organization nanoid (plus optional status /
 * cancel-at-period-end). Delegates to `subscriptions.services.create_subscription`,
 * which rejects unknown plans/organizations and organizations that already
 * have a subscription.
 */
export async function addSubscription(
  body: SubscriptionCreateInput,
  opts: { workspace?: string } = {},
): Promise<Subscription> {
  return serverMutate<Subscription>("/apis/subscriptions/all/add/", {
    method: "POST",
    body,
    ...opts,
  });
}

/**
 * Update a subscription
 */
export async function updateSubscription(
  nanoid: string,
  body: SubscriptionUpdateInput,
  opts: { workspace?: string } = {},
): Promise<Subscription> {
  return serverMutate<Subscription>(`/apis/subscriptions/all/${nanoid}/`, {
    method: "PATCH",
    body,
    ...opts,
  });
}

/**
 * Delete a subscription
 */
export async function deleteSubscription(nanoid: string, opts: { workspace?: string } = {}): Promise<void> {
  await serverMutate<void>(`/apis/subscriptions/all/${nanoid}/`, {
    method: "DELETE",
    body: {},
    ...opts,
  });
}

// ── Plans ───────────────────────────────────────────────────────────────────

/**
 * Get all plans
 */
export async function listPlans({ workspace }: { workspace?: string } = {}): Promise<SubsPlan[]> {
  const payload = await serverFetch<Paginated<SubsPlan> | SubsPlan[]>("/apis/subscriptions/plans/", { workspace });
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

/**
 * Get a single plan by nanoid
 */
export async function getPlan(nanoid: string, opts: { workspace?: string } = {}): Promise<SubsPlan | null> {
  const payload = await serverFetch<SubsPlan>(
    `/apis/subscriptions/plans/${nanoid}/`,
    opts,
  );
  return payload;
}

/**
 * Create a new plan
 */
export async function createPlan(
  body: Partial<SubsPlan> & { slug?: string },
  opts: { workspace?: string } = {},
): Promise<SubsPlan> {
  return serverMutate<SubsPlan>("/apis/subscriptions/plans/", {
    method: "POST",
    body,
    ...opts,
  });
}

/**
 * Update a plan
 */
export async function updatePlan(
  nanoid: string,
  body: Partial<SubsPlan>,
  opts: { workspace?: string } = {},
): Promise<SubsPlan> {
  return serverMutate<SubsPlan>(`/apis/subscriptions/plans/${nanoid}/`, {
    method: "PATCH",
    body,
    ...opts,
  });
}

/**
 * Delete a plan
 */
export async function deletePlan(nanoid: string, opts: { workspace?: string } = {}): Promise<void> {
  await serverMutate<void>(`/apis/subscriptions/plans/${nanoid}/`, {
    method: "DELETE",
    body: {},
    ...opts,
  });
}

// ── Plan features ───────────────────────────────────────────────────────────

/**
 * Get all features
 */
export async function listFeatures({ workspace }: { workspace?: string } = {}): Promise<PlanFeature[]> {
  const payload = await serverFetch<Paginated<PlanFeature> | PlanFeature[]>("/apis/subscriptions/features/", { workspace });
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

/**
 * List every feature registered in the backend's subscription registry.
 *
 * Read-only and not stored in the database — the endpoint returns a plain
 * array (no pagination envelope). `key` is what a `PlanFeature` stores.
 */
export async function listRegistryFeatures({ workspace }: { workspace?: string } = {}): Promise<RegistryFeature[]> {
  const payload = await serverFetch<
    RegistryFeature[] | Paginated<RegistryFeature>
  >("/apis/subscriptions/feature-registry/", { workspace });
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

/**
 * Get a single feature by nanoid
 */
export async function getFeature(nanoid: string, opts: { workspace?: string } = {}): Promise<PlanFeature | null> {
  const payload = await serverFetch<PlanFeature>(
    `/apis/subscriptions/features/${nanoid}/`,
    opts,
  );
  return payload;
}

/**
 * Create a feature on a plan
 */
export async function createPlanFeature(
  body: PlanFeatureFormInput,
  opts: { workspace?: string } = {},
): Promise<PlanFeature> {
  return serverMutate<PlanFeature>("/apis/subscriptions/features/", {
    method: "POST",
    body,
    ...opts,
  });
}

/**
 * Create many features on a plan at once.
 *
 * POSTs a JSON array to the same endpoint; the backend accepts either a
 * single object or a list and bulk-creates one `PlanFeature` row per entry.
 */
export async function createPlanFeatures(
  body: PlanFeatureFormInput[],
  opts: { workspace?: string } = {},
): Promise<PlanFeature[]> {
  return serverMutate<PlanFeature[]>("/apis/subscriptions/features/", {
    method: "POST",
    body,
    ...opts,
  });
}

/**
 * Update a feature by nanoid
 */
export async function updatePlanFeature(
  nanoid: string,
  body: PlanFeatureUpdateInput,
  opts: { workspace?: string } = {},
): Promise<PlanFeature> {
  return serverMutate<PlanFeature>(`/apis/subscriptions/features/${nanoid}/`, {
    method: "PATCH",
    body,
    ...opts,
  });
}

/**
 * Delete a feature by nanoid
 */
export async function deletePlanFeature(nanoid: string, opts: { workspace?: string } = {}): Promise<void> {
  await serverMutate<void>(`/apis/subscriptions/features/${nanoid}/`, {
    method: "DELETE",
    body: {},
    ...opts,
  });
}