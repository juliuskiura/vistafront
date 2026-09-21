import { SubsPlan, type Order } from "@/lib/api";

/** The order's currency is the model default ``"Ksh"``; invoice rendering needs
 * an ISO-4217 code, so map the backend spelling to ``KES``. */
export function displayCurrency(currency: string): string {
  return currency.toUpperCase() === "KSH" ? "KES" : currency || "KES";
}

// Computed once at module load so the invoice's cosmetic dates are stable and
// render is deterministic.
const _now = Date.now();
const _isoDate = (offsetDays: number) =>
  new Date(_now + offsetDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
const invoiceDates = {
  issued: _isoDate(0),
  due: _isoDate(15),
  periodStart: _isoDate(-30),
  periodEnd: _isoDate(30),
};

export interface InvoiceItem {
  description: string;
  detail?: string;
  featureKey?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  code?: string;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  nextBillingDate: string;
  status: "paid" | "pending" | "overdue";
  totalAmount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  items: InvoiceItem[];
}

/** Build the invoice for the invoice detail page.
 *
 * The whole order is billed: the checkout has already removed unwanted lines,
 * so every remaining item is rendered as a charge exactly as the backend
 * priced it. ``keptItemNanoids`` may restrict the billable rows further for
 * callers that need a subset view; when ``null`` every order item is billed.
 */
export function buildInvoiceData(
  order: Order,
  plan: SubsPlan,
  keptItemNanoids?: Iterable<string>,
): InvoiceData {
  const kept = keptItemNanoids ? new Set(keptItemNanoids) : null;
  const orderItems = (order.items ?? []).filter(
    (item) => !kept || kept.has(item.nanoid),
  );
  const totalFromItems = orderItems.reduce(
    (sum, item) => sum + Number(item.amount ?? 0),
    0,
  );
  return {
    id: order.nanoid || "ord-" + _now,
    invoiceNumber: order.refid || `ORD-${_now % 10000}`,
    issuedDate: (order.created_at || invoiceDates.issued).split("T")[0],
    dueDate: invoiceDates.due,
    nextBillingDate: order.next_billing_date ?? invoiceDates.due,
    status: order.status === "confirmed" ? ("paid" as const) : ("pending" as const),
    totalAmount: kept
      ? totalFromItems
      : order.total != null
        ? Number(order.total)
        : totalFromItems,
    currency: displayCurrency(order.currency),
    periodStart: invoiceDates.periodStart,
    periodEnd: invoiceDates.periodEnd,
    items: [
      ...orderItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price ?? 0),
        total: Number(item.amount ?? 0),
        code: item.nanoid,
      })),
      // Zero-cost informational rows so the invoice still showcases the plan's
      // included capabilities (the order itself carries one row per product).
      ...(plan.features ?? []).map((feature) => ({
        // `feature.feature` is the backend registry key (e.g.
        // "socialmanager.posts") and drives the icon/tone lookup, so it must
        // not be used as display copy — `label` is the human title.
        description: feature.label || feature.feature,
        detail: feature.description,
        featureKey: feature.feature,
        quantity: 1,
        unitPrice: 0,
        total: 0,
        code: "FEAT-" + feature.nanoid,
      })),
    ],
  };
}