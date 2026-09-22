import Link from "next/link";

import {
  getInvoice,
  getOrder,
  getPlan,
  getOrganization,
  getPaypalQuote,
  listPaymentMethods,
  type Invoice,
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
import { InvoiceReceiptView } from "../_components/invoice-receipt";
import { InvoiceStatusView } from "../_components/invoice-status-view";

/** Map an open backend invoice onto the client shape the checkout renders. */
function toInvoiceData(
  invoice: Invoice,
  order: Order,
  plan: SubsPlan,
): InvoiceData {
  const base = buildInvoiceData(order, plan);
  // The backend snapshot rows are authoritative; the order/plan are only a
  // fallback when the invoice carries no items of its own yet.
  const snapshot = (invoice.items ?? []).filter(
    (item) => Number(item.amount ?? 0) > 0,
  );
  const chargeItems =
    snapshot.length > 0
      ? snapshot.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price ?? 0),
          total: Number(item.amount ?? 0),
          code: item.nanoid,
        }))
      : base.items.filter((item) => item.total > 0);
  return {
    ...base,
    id: invoice.nanoid,
    invoiceNumber: invoice.number || invoice.refid || base.invoiceNumber,
    issuedDate: (invoice.issued_at ?? invoice.created_at ?? base.issuedDate)
      .split("T")[0],
    dueDate: invoice.due_at ? invoice.due_at.split("T")[0] : base.dueDate,
    status: "pending",
    totalAmount: Number(invoice.total),
    currency: displayCurrency(invoice.currency),
    items: [
      ...chargeItems,
      ...base.items.filter((item) => item.total === 0),
    ],
  };
}

function NotFound({ workspaceDomain }: { workspaceDomain: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 pt-10 text-center">
      <h1 className="text-xl font-semibold">Invoice not found</h1>
      <p className="text-sm text-muted-foreground">
        This invoice is no longer available or the link is invalid.
      </p>
      <Link
        href={`/${workspaceDomain}/dashboard/billing`}
        className="inline-block text-sm font-medium text-primary hover:underline"
      >
        ← Back to Billing
      </Link>
    </div>
  );
}

/**
 * Invoice detail page — the rendered invoice every order checkout lands on
 * after "Confirm & Pay" (`/dashboard/invoices/{invoice.nanoid}`, path-only).
 *
 * The page follows the invoice lifecycle: a **paid** invoice renders a settled
 * receipt (no payment UI); an **open** invoice drops the buyer into the
 * payment checkout; **void** / **draft** / **uncollectible** invoices render a
 * terminal status card with totals and dates but no way to pay.
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
    return <NotFound workspaceDomain={active.domain} />;
  }

  if (invoice.status === "paid") {
    return (
      <div className="flex min-h-full flex-col">
        <Banner
          title={`Invoice ${invoice.number || invoice.refid}`}
          description={`Paid in full on ${invoice.paid_at ? formatMediumDate(invoice.paid_at) : "settlement"}`}
        />
        <div className="mt-6 flex-1">
          {paypalReturn === "approved" && (
            <div className="mx-auto mb-4 max-w-3xl rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Payment approved. Your invoice is now settled — a receipt has
              been issued.
            </div>
          )}
          <InvoiceReceiptView
            invoice={invoice}
            workspaceDomain={active.domain}
          />
        </div>
      </div>
    );
  }

  if (
    invoice.status === "void" ||
    invoice.status === "draft" ||
    invoice.status === "uncollectible"
  ) {
    return (
      <div className="flex min-h-full flex-col">
        <Banner
          title={`Invoice ${invoice.number || invoice.refid}`}
          description={statusDescription(invoice.status)}
        />
        <div className="mt-6 flex-1">
          <InvoiceStatusView
            invoice={invoice}
            workspaceDomain={active.domain}
          />
        </div>
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
        <h1 className="text-xl font-semibold">
          Invoice {invoice.number || invoice.refid}
        </h1>
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
          <div className="mx-auto mb-4 max-w-5xl rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Payment approved. Your invoice is now settled — a receipt has been
            issued.
          </div>
        )}
        {paypalReturn === "error" && (
          <div className="mx-auto mb-4 max-w-5xl rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
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

function statusDescription(status: Invoice["status"]): string {
  switch (status) {
    case "void":
      return "This invoice was voided and is no longer payable.";
    case "draft":
      return "This invoice is still being prepared and is not yet payable.";
    case "uncollectible":
      return "This invoice could not be collected; no payment is being pursued.";
    default:
      return "";
  }
}