import { 
  Invoice,
  Paginated,
  InvoiceInput,
  InvoiceExtensionForm,
  Payment,
  PaymentMethod,
  PaypalQuote,
  PaypalOrder,
} from "@/lib/api/types";
import { serverFetch, serverMutate } from "./server-fetch";

export async function listInvoices({ workspace }: { workspace: string }): Promise<Invoice[]> {
  const payload = await serverFetch<Paginated<Invoice> | Invoice[]>("/apis/billing/invoices/", { workspace });
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

export async function getInvoice(
  nanoid: string,
  { workspace }: { workspace: string },
): Promise<Invoice> {
  return serverFetch<Invoice>(`/apis/billing/invoices/${nanoid}/`, { workspace });
}

/**
 * Confirm an order at checkout and return its invoice.
 *
 * The backend invoices within ``itemNanoids`` when a non-empty list is passed;
 * an empty list bills the whole order (the checkout today already removed
 * unwanted lines). The endpoint is idempotent — an order already carrying an
 * invoice returns that one instead of a new row.
 */
export async function createInvoiceFromOrder(
  orderNanoid: string,
  itemNanoids: string[],
  { workspace }: { workspace: string },
): Promise<Invoice> {
  return serverMutate<Invoice>(
    `/apis/billing/orders/${orderNanoid}/create-invoice/`,
    { method: "POST", body: { items: itemNanoids }, workspace },
  );
}

export async function createInvoice(
  body: InvoiceInput,
  { workspace }: { workspace: string },
): Promise<Invoice> {
  return serverMutate<Invoice>("/apis/billing/invoices/create/", {
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
    `/apis/billing/invoices/${invoiceNanoid}/extend/`,
    {
      method: "POST",
      body,
      workspace,
    },
  );
}
export async function listPayments({ workspace }: { workspace: string }): Promise<Payment[]> {
  const payload = await serverFetch<Paginated<Payment> | Payment[]>("/apis/billing/payments/", { workspace });
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

/**
 * Fetch the backend-computed PayPal quote (marked-up USD) for an invoice.
 *
 * The converted amount is authoritative: ``paypal/create`` charges exactly
 * ``amount_usd`` for this invoice, so the amount shown to the buyer in the
 * checkout is the amount PayPal will ask for. Run server-side (Server
 * Component or Server Action) — it never runs on the client island.
 */
export async function getPaypalQuote(
  invoiceNanoid: string,
  { workspace }: { workspace: string },
): Promise<PaypalQuote> {
  const qs = new URLSearchParams({ invoice: invoiceNanoid });
  return serverFetch<PaypalQuote>(
    `/apis/billing/payments/paypal/quote/?${qs.toString()}`,
    { workspace },
  );
}

/**
 * Create a PayPal order for an invoice and get the buyer's approve URL.
 *
 * The markup is applied backend-side; the frontend receives only the final
 * chargeable amount and the redirect URL. Called from a Server Action (the
 * buy flow is a mutation, and the returned ``approve_url`` is external, so a
 * server-side call avoids client-side navigation to a foreign origin).
 */
export async function createPaypalCheckout(
  invoiceNanoid: string,
  { workspace, returnUrl, cancelUrl }: { workspace: string; returnUrl: string; cancelUrl: string },
): Promise<PaypalOrder> {
  return serverMutate<PaypalOrder>("/apis/billing/payments/paypal/create/", {
    method: "POST",
    body: {
      invoice: invoiceNanoid,
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
    workspace,
  });
}

/**
 * Capture a PayPal order the buyer already approved. Returns the captured
 * ``Payment`` (status "succeeded" on success). Called server-side only.
 */
export async function capturePaypalOrder(
  orderId: string,
  { workspace }: { workspace: string },
): Promise<Payment> {
  return serverMutate<Payment>(
    "/apis/billing/payments/paypal/capture/",
    { method: "POST", body: { order_id: orderId }, workspace },
  );
}
export async function listPaymentMethods(
  { workspace }: { workspace: string },
  clientBusiness?: string,
): Promise<PaymentMethod[]> {
  const qs = clientBusiness ? `?client_business=${encodeURIComponent(clientBusiness)}` : "";
  const payload = await serverFetch<Paginated<PaymentMethod> | PaymentMethod[]>(
    `/apis/billing/payment-methods/${qs}`,
    { workspace },
  );
  return Array.isArray(payload) ? payload : payload.results ?? [];
}