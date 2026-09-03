"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  Invoice,
  Payment,
  Plan,
  Subscription,
  InvoiceExtension,
} from "@/lib/api";

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

const SUBSCRIPTION_STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  past_due: "bg-amber-100 text-amber-700 border-amber-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BillingClient({
  invoices,
  payments,
  plans,
  subscription,
  workspaceName,
}: {
  invoices: Invoice[];
  payments: Payment[];
  plans: Plan[];
  subscription: Subscription | null;
  workspaceName: string;
  workspaceDomain: string;
}) {
  const [tab, setTab] = useState<Tab>("plans");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage how your organization pays, view invoices, and review payment
          history.
        </p>
      </header>

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
          <InvoicesTab invoices={invoices} />
        )}
        {tab === "payment-history" && (
          <PaymentHistoryTab payments={payments} />
        )}
        {tab === "plans" && (
          <PlansTab
            plans={plans}
            subscription={subscription}
            workspaceName={workspaceName}
          />
        )}
      </div>
    </div>
  );
}

function InvoicesTab({ invoices }: { invoices: Invoice[] }) {
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
                <p className="font-medium">
                  {inv.number || inv.refid}{" "}
                  <span className="text-muted-foreground">
                    · {inv.total} {inv.currency}
                  </span>
                </p>
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

function PlansTab({
  plans,
  subscription,
  workspaceName,
}: {
  plans: Plan[];
  subscription: Subscription | null;
  workspaceName: string;
}) {
  const hasSubscription = subscription !== null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Available Plans</h1>
          <p className="text-sm text-muted-foreground">
            {workspaceName}&apos;s plan and the full catalog of available plans.
          </p>
        </div>
        <Button variant="outline" disabled title="Contact sales to change plans">
          Change plan
        </Button>
      </header>

      {hasSubscription ? (
        <section className="glass-surface-green rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Current plan
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                {subscription.plan_label}
              </h2>
            </div>
            <Badge
              className={`${SUBSCRIPTION_STATUS_STYLES[subscription.status] ?? ""} border px-3 py-1 text-sm font-semibold capitalize`}
              variant="outline"
            >
              {subscription.status}
            </Badge>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Current period
              </dt>
              <dd className="mt-1 text-sm">
                {formatDate(subscription.current_period_start)} –{" "}
                {formatDate(subscription.current_period_end)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Renewal
              </dt>
              <dd className="mt-1 text-sm">
                {subscription.cancel_at_period_end
                  ? "Cancels at period end"
                  : "Renews automatically"}
              </dd>
            </div>
          </dl>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Included apps
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {subscription.app_keys.length === 0 && (
                <span className="text-sm text-muted-foreground">None</span>
              )}
              {subscription.app_keys.map((key) => (
                <Badge key={key} variant="secondary">
                  {key}
                </Badge>
              ))}
            </div>
          </div>

          {subscription.feature_flags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Add-on capabilities
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {subscription.feature_flags.map((flag) => (
                  <Badge key={flag} variant="outline">
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-sidebar-divider bg-card p-6 text-sm text-muted-foreground">
          No active subscription was found for this organization.
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Plan catalog</h2>
        </div>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading plans…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = subscription?.plan_slug === plan.slug;
              return (
                <div
                  key={plan.slug}
                  className={`flex flex-col rounded-xl border p-5 shadow-sm ${
                    isCurrent
                      ? "glass-surface-green border-emerald-400/50 ring-1 ring-emerald-400/30"
                      : "border-sidebar-divider bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{plan.label}</h3>
                    {isCurrent && (
                      <Badge className="border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-600 ring-1 ring-emerald-500/30">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 min-h-[2.5rem] text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <div className="mt-3 text-sm">
                    <span className="font-semibold">
                      {plan.price_per_seat != null
                        ? `$${Number(plan.price_per_seat).toLocaleString()}`
                        : "Custom"}
                    </span>
                    <span className="text-muted-foreground"> / seat</span>
                    {plan.seat_limit != null && (
                      <span className="ml-2 text-muted-foreground">
                        · up to {plan.seat_limit} seats
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {plan.app_keys.map((key) => (
                      <Badge key={key} variant="secondary">
                        {key}
                      </Badge>
                    ))}
                    {plan.feature_flags.map((flag) => (
                      <Badge key={flag} variant="outline">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
