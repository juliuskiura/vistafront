import Link from "next/link";

import type { Invoice } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { ArrowRight, FileText } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";

const STATUS_STYLES: Record<Invoice["status"], string> = {
  draft: "bg-border/60 text-muted-foreground",
  open: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  void: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  uncollectible: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

function displayCurrency(currency: string): string {
  return currency.toUpperCase() === "KSH" ? "KES" : currency || "KES";
}

function formatMoney(invoice: Invoice): string {
  const amount = Number(invoice.total ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount} ${displayCurrency(invoice.currency)}`;
}

function InvoiceCard({
  invoice,
  workspaceDomain,
}: {
  invoice: Invoice;
  workspaceDomain: string;
}) {
  const isPaid = invoice.status === "paid";

  return (
    <Card className="rounded-xl border bg-card transition-colors hover:border-primary/40">
      <Link
        href={`/${workspaceDomain}/dashboard/invoices/${invoice.nanoid}`}
        className="group flex w-full items-center justify-between gap-4 p-4 md:p-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-bold text-foreground">
                {invoice.number || invoice.refid}
              </p>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[invoice.status] ?? "bg-border/60 text-muted-foreground"}`}
              >
                {invoice.status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Issued{" "}
              {formatMediumDate(invoice.issued_at ?? invoice.created_at ?? "")}
              {invoice.due_at && ` · due ${formatMediumDate(invoice.due_at)}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-extrabold text-foreground">
              {formatMoney(invoice)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isPaid
                ? "Paid in full"
                : invoice.status === "void"
                  ? "Voided"
                  : invoice.status === "draft"
                    ? "Not payable yet"
                    : invoice.paid_at
                      ? `Paid ${formatMediumDate(invoice.paid_at)}`
                      : "Awaiting payment"}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
            {isPaid ? "View" : "Review"}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </Card>
  );
}

export function InvoicesList({
  invoices,
  workspaceDomain,
}: {
  invoices: Invoice[];
  workspaceDomain: string;
}) {
  const sorted = [...invoices].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
      new Date(a.created_at ?? 0).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <Card className="rounded-xl border bg-card p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileText className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-sm font-bold text-foreground">No invoices yet</h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          When you confirm a plan checkout, its invoice appears here — and,
          once paid, its receipt PDF is available for download.
        </p>
        <Link
          href={`/${workspaceDomain}/dashboard/billing`}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95"
        >
          Choose a plan
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((invoice) => (
        <InvoiceCard
          key={invoice.nanoid}
          invoice={invoice}
          workspaceDomain={workspaceDomain}
        />
      ))}
    </div>
  );
}