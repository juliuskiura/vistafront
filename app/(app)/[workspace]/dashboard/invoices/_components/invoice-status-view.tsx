import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Clock, FileX, Hourglass } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";
import type { Invoice, InvoiceStatus } from "@/lib/api";
import { displayCurrency } from "./invoice-data";

function money(invoice: Invoice, value: number | string): string {
  const amount = Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount} ${displayCurrency(invoice.currency)}`;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

const STATUS_COPY: Record<
  Exclude<InvoiceStatus, "paid" | "open">,
  { title: string; description: string; icon: "void" | "draft" | "uncollectible" }
> = {
  void: {
    title: "Invoice voided",
    description:
      "This invoice was cancelled and is no longer payable. Nothing was charged for it.",
    icon: "void",
  },
  draft: {
    title: "Invoice not issued yet",
    description:
      "This billing document is still being prepared and is not yet payable. Check back shortly.",
    icon: "draft",
  },
  uncollectible: {
    title: "Invoice uncollectible",
    description:
      "This invoice could not be collected and no payment is being pursued. Contact support if you believe this is in error.",
    icon: "uncollectible",
  },
};

const ICONS = {
  void: FileX,
  draft: Hourglass,
  uncollectible: Clock,
} as const;

const TONES = {
  void: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  draft: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  uncollectible: "bg-border/60 text-muted-foreground",
} as const;

/**
 * Terminal (non-payable) invoice state: voided, still a draft, or
 * uncollectible. These render the totals and dates but deliberately no payment
 * UI — there is nothing a buyer can or should pay against them.
 */
export function InvoiceStatusView({
  invoice,
  workspaceDomain,
}: {
  invoice: Invoice;
  workspaceDomain: string;
}) {
  const status = invoice.status as Exclude<InvoiceStatus, "paid" | "open">;
  const copy = STATUS_COPY[status];
  const Icon = ICONS[copy.icon];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <Link
        href={`/${workspaceDomain}/dashboard/invoices`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← All invoices
      </Link>

      <Card className="rounded-2xl border bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${TONES[copy.icon]}`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Invoice
              </p>
              <h2 className="mt-0.5 text-2xl font-bold text-foreground">
                {invoice.number || invoice.refid}
              </h2>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {copy.title}
              </p>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                {copy.description}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Amount
            </p>
            <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-foreground">
              {money(invoice, invoice.total)}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-sidebar-divider pt-5 sm:grid-cols-4">
          <Detail
            label="Issued"
            value={
              invoice.issued_at
                ? formatMediumDate(invoice.issued_at)
                : invoice.created_at
                  ? formatMediumDate(invoice.created_at)
                  : "—"
            }
          />
          <Detail
            label="Due"
            value={invoice.due_at ? formatMediumDate(invoice.due_at) : "—"}
          />
          <Detail label="Paid" value="—" />
          <Detail label="Order" value={invoice.order ? `#${invoice.order}` : "—"} />
        </dl>

        <div className="mt-6 space-y-2 rounded-xl border border-sidebar-divider bg-muted/30 p-4 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{money(invoice, invoice.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Tax</span>
            <span>{money(invoice, invoice.tax)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-sidebar-divider pt-2 text-base font-bold text-foreground">
            <span>Total</span>
            <span>{money(invoice, invoice.total)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}