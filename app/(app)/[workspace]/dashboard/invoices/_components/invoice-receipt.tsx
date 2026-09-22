import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ChevronLeft, Download, FileText } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";
import type { Invoice } from "@/lib/api";
import { displayCurrency } from "./invoice-data";

function money(invoice: Invoice, value: number | string): string {
  const amount = Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount} ${displayCurrency(invoice.currency)}`;
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

/**
 * The fully-paid invoice detail view: a settled summary with the receipt PDF.
 *
 * This is the page the buyer lands on after a successful PayPal capture — it
 * shows the invoice totals, payment dates and a link to the stored receipt.
 * It deliberately renders no payment UI of any kind: a paid invoice has
 * nothing left to pay.
 */
export function InvoiceReceiptView({
  invoice,
  workspaceDomain,
}: {
  invoice: Invoice;
  workspaceDomain: string;
}) {
  const statusLabel =
    invoice.status === "paid"
      ? "Paid"
      : invoice.status === "open"
        ? "Open"
        : invoice.status;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <Link
        href={`/${workspaceDomain}/dashboard/invoices`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All invoices
      </Link>

      <Card className="rounded-2xl border bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <img
              src="https://vsregmedia.s3.amazonaws.com/branding/logo_5MuHLkV.svg"
              alt="VistaSolve"
              className="mb-4 h-8 w-auto"
            />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Invoice
            </p>
            <h2 className="mt-0.5 text-2xl font-bold text-foreground">
              {invoice.number || invoice.refid}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                {statusLabel}
              </Badge>
              {invoice.paid_at && (
                <span className="text-xs text-muted-foreground">
                  Paid {formatMediumDate(invoice.paid_at)}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total paid
            </p>
            <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-foreground">
              {money(invoice, invoice.total)}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-sidebar-divider pt-5 sm:grid-cols-4">
          <Detail
            label="Issued"
            value={formatMediumDate(invoice.issued_at ?? invoice.created_at ?? "")}
          />
          <Detail
            label="Due"
            value={invoice.due_at ? formatMediumDate(invoice.due_at) : "—"}
          />
          <Detail
            label="Paid"
            value={invoice.paid_at ? formatMediumDate(invoice.paid_at) : "—"}
          />
          <Detail
            label="Order"
            value={invoice.order ? `#${invoice.order}` : "—"}
          />
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
            <span>Total paid</span>
            <span>{money(invoice, invoice.total)}</span>
          </div>
        </div>
      </Card>

      {invoice.pdf_url ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-sidebar-divider bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Invoice PDF
              </p>
              <p className="text-xs text-muted-foreground">
                “{invoice.refid}.pdf” is your paid invoice — watermarked PAID —
                for your records.
              </p>
            </div>
          </div>
          <a
            href={invoice.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95"
          >
            <Download className="h-3.5 w-3.5" />
            Download invoice
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-sidebar-divider bg-card p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            The PDF for this invoice is not available yet. Please check back
            shortly.
          </p>
        </div>
      )}
    </div>
  );
}