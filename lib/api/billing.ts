import { serverFetch, serverMutate } from "./server-fetch";
import type {
  Invoice,
  Paginated,
  Payment,
  PaymentMethod,
  Plan,
  Subscription,
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

// ── Subscriptions ───────────────────────────────────────────────────────────

export async function getSubscription({
  workspace,
}: {
  workspace: string;
}): Promise<Subscription> {
  return serverFetch<Subscription>("/apis/subscription/current/", { workspace });
}
