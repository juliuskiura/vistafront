import { 
  Invoice,
  Paginated,
  InvoiceInput,
  InvoiceExtensionForm,
  Payment,
  PaymentMethod 
} from "@/lib/api/types";
import { serverFetch, serverMutate } from "./server-fetch";
import type { RequestOptions } from "./server-fetch-types";

export async function listInvoices({ workspace }: { workspace: string }): Promise<Invoice[]> {
  const payload = await serverFetch<Paginated<Invoice> | Invoice[]>("/apis/billing/invoices/", { workspace });
  return Array.isArray(payload) ? payload : payload.results ?? [];
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