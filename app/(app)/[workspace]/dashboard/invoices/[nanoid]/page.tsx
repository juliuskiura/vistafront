import Link from "next/link";

import {
  getInvoice,
  getOrder,
  getPlan,
  getOrganization,
  getPaypalQuote,
  listPaymentMethods,
  type Invoice,
  type InvoiceStatus,
  type Order,
  type SubsPlan,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { formatMediumDate } from "@/lib/dates";
import {
  buildInvoiceData,
  displayCurrency,
  type InvoiceData,
} from "../_components/invoice-data";
import { PaymentCheckoutClient } from "../_components/payment-checkout-client";

const DISPLAY_STATUS: Record<InvoiceStatus, InvoiceData["status"]> = {
  paid: "paid",
  open: "pending",
  draft: "pending",
  void: "pending",
  uncollectible: "overdue",
};

/** Map a backend invoice onto the client invoice shape the UI renders. */
function toInvoiceData(
  invoice: Invoice,
  order: Order,
  plan: SubsPlan,
): InvoiceData {
  const base = buildInvoiceData(order, plan);
  return {
    ...base,
    id: invoice.nanoid,
    invoiceNumber: invoice.number || invoice.refid || base.invoiceNumber,
    issuedDate: (invoice.created_at ?? base.issuedDate).split("T")[0],
    dueDate: invoice.due_at ? invoice.due_at.split("T")[0] : base.dueDate,
    status: DISPLAY_STATUS[invoice.status] ?? "pending",
    totalAmount: Number(invoice.total),
    currency: displayCurrency(invoice.currency),
  };
}

/**
 * Invoice detail page — the rendered invoice every order checkout lands on
 * after "Confirm & Pay" (`/dashboard/invoices/{invoice.nanoid}`, path-only).
 *
 * The line items are reconstructed from the linked order (which the customer
 * already edited by removing lines before confirming) while the totals come
 * from the backend invoice, which is authoritative.
 */
export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string; nanoid: string }>;
searchParams: Promise<{ paypal?: string }>;
}) {
  const { workspace: slug, nanoid } = await params;
  const { paypal: paypalReturn } = await searchParams;

  const active = await requireWorkspace(slug);

  const invoice = await getInvoice(nanoid, {
    workspace: active.domain,
  }).catch(() => null);

  if (!invoice) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-10 text-center">
        <h1 className="text-xl font-semibold">Invoice not found</h1>
        <p className="text-sm text-muted-foreground">
          This invoice is no longer available or the link is invalid.
        </p>
        <Link
          href={`/${active.domain}/dashboard/billing`}
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          ← Back to Billing
        </Link>
      </div>
    );
  }

  const order = invoice.order
    ? await getOrder(invoice.order, {
        workspace: active.domain,
      }).catch(() => null)
    : null;
  const planNanoid = order?.items?.[0]?.product?.nanoid ?? null;
  const plan = planNanoid
    ? await getPlan(planNanoid).catch(() => null)
    : null;

  if (!order || !plan) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-10 text-center">
        <h1 className="text-xl font-semibold">Invoice {invoice.number || invoice.refid}</h1>
        <p className="text-sm text-muted-foreground">
          The plan behind this invoice is no longer available.
        </p>
        <Link
          href={`/${active.domain}/dashboard/billing`}
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          ← Back to Billing
        </Link>
      </div>
    );
  }

  const data = toInvoiceData(invoice, order, plan);

  const org = await getOrganization(
    active.client_business,
    active.domain,
  ).catch(() => null);
  if (!org) {
    throw new Error("Organization not found");
  }

  const paymentMethods = await listPaymentMethods(
    { workspace: active.domain },
    active.client_business,
  ).catch(() => []);

  const paypalQuote = await getPaypalQuote(invoice.nanoid, {
    workspace: active.domain,
  }).catch(() => null);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title={`Invoice ${data.invoiceNumber}`}
        description={`Issued on ${formatMediumDate(data.issuedDate)} · due on ${formatMediumDate(data.dueDate)}`}
      />
      <div className="mt-6 flex-1">
        {paypalReturn === "approved" && (
          <div className="mx-auto max-w-5xl mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
            Payment approved. Your invoice is now settled — a receipt has been
            issued.
          </div>
        )}
        {paypalReturn === "error" && (
          <div className="mx-auto max-w-5xl mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
            PayPal could not complete the payment. Please try again or use
            another payment channel.
          </div>
        )}

        <PaymentCheckoutClient
          invoiceNumber={invoice.refid || invoice.number}
          invoiceNanoid={invoice.nanoid}
          invoiceTotal={Number(invoice.total)}
          invoiceCurrency={invoice.currency || data.currency}
          paypalQuote={paypalQuote}
          order={order}
          plan={plan}
          paymentMethods={paymentMethods}
          workspace={active.domain}
          workspaceName={active.name}
          organization={org}
        />
      </div>
    </div>
  );
}