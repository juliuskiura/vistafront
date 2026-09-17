import { serverFetch, serverMutate } from "./server-fetch";
import type {
  Invoice,
  Paginated,
  Payment,
  PaymentMethod,
  Plan,
  PlanApp,
  PlanAppFormInput,
  PlanFeature,
  PlanFeatureFormInput,
  PlanFormInput,
  Subscription,
  SubscriptionCreateInput,
  SubscriptionUpdateInput,
  InvoiceExtensionForm,
  InvoiceInput,
} from "./types";

// ── Invoices ────────────────────────────────────────────────────────────────

export async function listInvoices({ workspace }: { workspace: string }): Promise<Invoice[]> {
  const payload = await serverFetch<Paginated<Invoice> | Invoice[]>("/apis/invoices/", { workspace });
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

export async function createInvoice(
  body: InvoiceInput,
  { workspace }: { workspace: string },
): Promise<Invoice> {
  return serverMutate<Invoice>("/apis/invoices/create/", {
    method: "POST",
    body,
    workspace,
  });
}

export async function extendInvoice(
  invoiceNanoid: string,
  body: InvoiceExtensionForm,
  { workspace }: { workspace: string },
): Promise<InvoiceExtensionForm> {
  return serverMutate<InvoiceExtensionForm>(
    `/apis/invoices/${invoiceNanoid}/extend/`,
    {
      method: "POST",
      body,
      workspace,
    },
  );
}

// ── Payments ────────────────────────────────────────────────────────────────

export async function listPayments({ workspace }: { workspace: string }): Promise<Payment[]> {
  const payload = await serverFetch<Paginated<Payment> | Payment[]>("/apis/payments/", { workspace });
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

// ── Payment methods ─────────────────────────────────────────────────────────

export async function listPaymentMethods(
  { workspace }: { workspace: string },
  clientBusiness?: string,
): Promise<PaymentMethod[]> {
  const qs = clientBusiness ? `?client_business=${encodeURIComponent(clientBusiness)}` : "";
  const payload = await serverFetch<Paginated<PaymentMethod> | PaymentMethod[]>(
    `/apis/payment-methods/${qs}`,
    { workspace },
  );
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

// ── Plans ───────────────────────────────────────────────────────────────────

export async function listPlans({ workspace }: { workspace: string }): Promise<Plan[]> {
  const payload = await serverFetch<Paginated<Plan> | Plan[]>("/apis/plans/", { workspace });
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

export async function getPlanByNanoid(
  nanoid: string,
  { workspace }: { workspace: string },
): Promise<Plan | null> {
  const plans = await listPlans({ workspace });
  return plans.find((plan) => plan.nanoid === nanoid) ?? null;
}

export async function createPlan(
  body: PlanFormInput,
  { workspace }: { workspace: string },
): Promise<Plan> {
  return serverMutate<Plan>("/apis/plans/", { method: "POST", body, workspace });
}

export async function updatePlan(
  slug: string,
  body: Partial<PlanFormInput>,
  { workspace }: { workspace: string },
): Promise<Plan> {
  return serverMutate<Plan>(`/apis/plans/${slug}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}

export async function deletePlan(
  slug: string,
  { workspace }: { workspace: string },
): Promise<void> {
  await serverMutate<void>(`/apis/plans/${slug}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

// ── Plan apps (app_key / feature_flag bindings) ─────────────────────────────

export async function listPlanApps(
  { workspace }: { workspace: string },
  plan?: string,
): Promise<PlanApp[]> {
  const qs = plan ? `?plan=${encodeURIComponent(plan)}` : "";
  const payload = await serverFetch<Paginated<PlanApp> | PlanApp[]>(
    `/apis/plan-apps/${qs}`,
    { workspace },
  );
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

export async function createPlanApp(
  body: PlanAppFormInput,
  { workspace }: { workspace: string },
): Promise<PlanApp> {
  return serverMutate<PlanApp>("/apis/plan-apps/", {
    method: "POST",
    body,
    workspace,
  });
}

export async function deletePlanApp(
  id: number,
  { workspace }: { workspace: string },
): Promise<void> {
  await serverMutate<void>(`/apis/plan-apps/${id}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

// ── Plan features (ordered headline strings per plan) ───────────────────────

export async function listPlanFeatures(
  { workspace }: { workspace: string },
  plan?: string,
): Promise<PlanFeature[]> {
  const qs = plan ? `?plan=${encodeURIComponent(plan)}` : "";
  const payload = await serverFetch<Paginated<PlanFeature> | PlanFeature[]>(
    `/apis/plan-features/${qs}`,
    { workspace },
  );
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

export async function createPlanFeature(
  body: PlanFeatureFormInput,
  { workspace }: { workspace: string },
): Promise<PlanFeature> {
  return serverMutate<PlanFeature>("/apis/plan-features/", {
    method: "POST",
    body,
    workspace,
  });
}

export async function deletePlanFeature(
  nanoid: string,
  { workspace }: { workspace: string },
): Promise<void> {
  await serverMutate<void>(`/apis/plan-features/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

// ── Subscriptions ───────────────────────────────────────────────────────────

export async function getSubscription({
  workspace,
}: {
  workspace: string;
}): Promise<Subscription> {
  return serverFetch<Subscription>("/apis/subscription/current/", { workspace });
}

export async function listSubscriptions({
  workspace,
}: {
  workspace: string;
}): Promise<Subscription[]> {
  const payload = await serverFetch<Paginated<Subscription> | Subscription[]>(
    "/apis/subscription/",
    { workspace },
  );
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

export async function createSubscription(
  body: SubscriptionCreateInput,
  { workspace }: { workspace: string },
): Promise<Subscription> {
  return serverMutate<Subscription>("/apis/subscription/", {
    method: "POST",
    body,
    workspace,
  });
}

export async function updateSubscription(
  id: number,
  body: SubscriptionUpdateInput,
  { workspace }: { workspace: string },
): Promise<Subscription> {
  return serverMutate<Subscription>(`/apis/subscription/${id}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}

export async function deleteSubscription(
  id: number,
  { workspace }: { workspace: string },
): Promise<void> {
  await serverMutate<void>(`/apis/subscription/${id}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}
