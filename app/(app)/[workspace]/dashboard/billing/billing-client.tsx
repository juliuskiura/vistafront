"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/banner";
import type {
  Invoice,
  InvoiceExtension,
  Payment,
  CurrentSubscription,
  SubsPlan,
} from "@/lib/api";
import { formatDate } from "./_components/dates";
import { PlansTab } from "./_components/plans-tab";

type Tab = "plans" | "invoices" | "payment-history";

const TABS: { key: Tab; label: string }[] = [
  { key: "plans", label: "Plans" },
  { key: "invoices", label: "Invoices" },
  { key: "payment-history", label: "Payment History" },
];

const INVOICE_STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  open: "bg-amber-100 text-amber-700 border-amber-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  void: "bg-rose-100 text-rose-700 border-rose-200",
  uncollectible: "bg-rose-100 text-rose-700 border-rose-200",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  succeeded: "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed: "bg-rose-100 text-rose-700 border-rose-200",
  refunded: "bg-amber-100 text-amber-700 border-amber-200",
};

export function BillingClient({
  invoices,
  payments,
  plans,
  subscription,
  workspaceName,
  workspaceDomain,
  clientBusinessNanoid,
  referralCode,
}: {
  invoices: Invoice[];
  payments: Payment[];
  plans: SubsPlan[];
  subscription: CurrentSubscription | null;
  workspaceName: string;
  workspaceDomain: string;
  clientBusinessNanoid: string;
  referralCode?: string;
}) {
  const [tab, setTab] = useState<Tab>("plans");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Banner
        title="Billing"
        description="Manage how your organization pays, view invoices, and review payment history."
      />

      <div className="flex flex-wrap gap-1 border-b border-sidebar-divider">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {tab === "invoices" && (
          <InvoicesTab invoices={invoices} workspaceDomain={workspaceDomain} />
        )}
        {tab === "payment-history" && (
          <PaymentHistoryTab payments={payments} />
        )}
        {tab === "plans" && (
          <PlansTab
            plans={plans}
            subscription={subscription}
            workspaceName={workspaceName}
            workspaceDomain={workspaceDomain}
            clientBusinessNanoid={clientBusinessNanoid}
            referralCode={referralCode}
          />
        )}
      </div>
    </div>
  );
}

function InvoicesTab({
  invoices,
  workspaceDomain,
}: {
  invoices: Invoice[];
  workspaceDomain: string;
}) {
  if (invoices.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Invoices</h2>
        <p className="text-sm text-muted-foreground">No invoices yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Invoices</h2>
      </div>
      <ul className="space-y-3">
        {invoices.map((inv) => (
          <li
            key={inv.nanoid}
            className="rounded-lg border border-sidebar-divider bg-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link
                  href={`/${workspaceDomain}/dashboard/invoices/${inv.nanoid}`}
                  className="font-medium transition-colors hover:text-primary"
                >
                  {inv.number || inv.refid}
                </Link>{" "}
                <span className="text-muted-foreground">
                  · {inv.total} {inv.currency}
                </span>
                <p className="text-xs text-muted-foreground">
                  Due {formatDate(inv.due_at)}
                  {inv.extensions && inv.extensions.length > 0 && (
                    <>
                      {" "}
                      · extended to{" "}
                      {formatDate(
                        inv.extensions[inv.extensions.length - 1].new_due_at,
                      )}
                    </>
                  )}
                </p>
              </div>
              <Badge
                className={`${INVOICE_STATUS_STYLES[inv.status] ?? ""} border`}
                variant="outline"
              >
                {inv.status}
              </Badge>
            </div>

            {inv.extensions && inv.extensions.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-sidebar-divider pt-2 text-xs text-muted-foreground">
                {inv.extensions.map((ext: InvoiceExtension) => (
                  <li key={ext.id}>
                    Extended to {formatDate(ext.new_due_at)} — {ext.reason}
                  </li>
                ))}
              </ul>
            )}

            {inv.line_items && inv.line_items.length > 0 && (
              <table className="mt-3 w-full border-t border-sidebar-divider pt-2 text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-1 font-medium">Description</th>
                    <th className="pb-1 text-right font-medium">Qty</th>
                    <th className="pb-1 text-right font-medium">Unit price</th>
                    <th className="pb-1 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.line_items.map((li) => (
                    <tr key={li.nanoid}>
                      <td className="py-1">{li.description}</td>
                      <td className="py-1 text-right">{li.quantity}</td>
                      <td className="py-1 text-right">
                        {li.unit_price} {inv.currency}
                      </td>
                      <td className="py-1 text-right">
                        {li.amount} {inv.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PaymentHistoryTab({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Payment History</h2>
        <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Payment History</h2>
      <ul className="space-y-2">
        {payments.map((p) => (
          <li
            key={p.nanoid}
            className="flex items-center justify-between rounded-lg border border-sidebar-divider bg-card p-4"
          >
            <div>
              <p className="font-medium">
                {p.amount} {p.currency}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(p.paid_at)}</p>
            </div>
            <Badge
              className={`${PAYMENT_STATUS_STYLES[p.status] ?? ""} border`}
              variant="outline"
            >
              {p.status}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}