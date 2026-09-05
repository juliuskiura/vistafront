import { serverFetch, serverMutate } from "./server-fetch";
import type {
  Invoice,
  Payment,
  PaymentMethod,
  Plan,
  Subscription,
  InvoiceExtensionForm,
  InvoiceInput,
} from "./types";

// ── Invoices ────────────────────────────────────────────────────────────────

export async function listInvoices({ workspace }: { workspace: string }): Promise<Invoice[]> {
  return serverFetch<Invoice[]>("/apis/invoices/", { workspace });
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
  return serverFetch<Payment[]>("/apis/payments/", { workspace });
}

// ── Payment methods ─────────────────────────────────────────────────────────

export async function listPaymentMethods(
  { workspace }: { workspace: string },
  clientBusiness?: string,
): Promise<PaymentMethod[]> {
  const qs = clientBusiness ? `?client_business=${encodeURIComponent(clientBusiness)}` : "";
  return serverFetch<PaymentMethod[]>(`/apis/payment-methods/${qs}`, { workspace });
}

// ── Plans ───────────────────────────────────────────────────────────────────

export async function listPlans({ workspace }: { workspace: string }): Promise<Plan[]> {
  return serverFetch<Plan[]>("/apis/plans/", { workspace });
}

// ── Subscriptions ───────────────────────────────────────────────────────────

export async function getSubscription({
  workspace,
}: {
  workspace: string;
}): Promise<Subscription> {
  return serverFetch<Subscription>("/apis/subscription/current/", { workspace });
}
