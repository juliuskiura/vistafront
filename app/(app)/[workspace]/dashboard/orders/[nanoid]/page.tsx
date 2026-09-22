import Link from "next/link";

import { getOrder, getPlan, getOrganization, type Order } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { Card } from "@/components/ui/card";
import { AlertCircle, ArrowRight, CheckCircle2 } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";
import { CheckoutClient } from "./checkout-client";

const fmtKes = (value: number | string) =>
  `KES ${Number(value ?? 0).toLocaleString()}`;

function TerminalCard({
  title,
  detail,
  timestamp,
  total,
  workspaceDomain,
}: {
  title: string;
  detail: string;
  timestamp: string | null;
  total: number | string;
  workspaceDomain: string;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 py-6">
      <Card className="rounded-2xl border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-sm font-bold text-foreground">{title}</h2>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {detail}
        </p>
        <dl className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-4">
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {timestamp ? "On" : "Date"}
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">
              {timestamp ? formatMediumDate(timestamp) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Total
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">
              {fmtKes(total)}
            </dd>
          </div>
        </dl>
        <Link
          href={`/${workspaceDomain}/dashboard/billing`}
          className="mt-7 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          Back to billing
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Card>
    </div>
  );
}

function ConfirmedView({
  order,
  workspaceDomain,
}: {
  order: Order;
  workspaceDomain: string;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 py-6">
      <Card className="rounded-2xl border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-sm font-bold text-foreground">
          Order confirmed
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {order.confirmed_at
            ? `This order was confirmed on ${formatMediumDate(order.confirmed_at)}. `
            : ""}
          Its invoice is ready — open it to pay or download the receipt.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          {order.invoice && (
            <Link
              href={`/${workspaceDomain}/dashboard/invoices/${order.invoice}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95"
            >
              View invoice
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <Link
            href={`/${workspaceDomain}/dashboard/orders`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            All orders
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ workspace: string; nanoid: string }>;
}) {
  const { workspace: slug, nanoid } = await params;
  const active = await requireWorkspace(slug);

  const order = await getOrder(nanoid, {
    workspace: active.domain,
  }).catch(() => null);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-10 text-center">
        <h1 className="text-xl font-semibold">Order not found</h1>
        <p className="text-sm text-muted-foreground">
          This order is no longer available or the link is invalid.
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

  if (order.status === "confirmed") {
    return (
      <div className="flex min-h-full flex-col">
        <Banner
          title="Review your order"
          description={`Your invoice for ${active.name} is confirmed and ready.`}
        />
        <ConfirmedView order={order} workspaceDomain={active.domain} />
      </div>
    );
  }

  if (order.status === "cancelled") {
    return (
      <div className="flex min-h-full flex-col">
        <Banner
          title="Review your order"
          description={`This order for ${active.name} was cancelled.`}
        />
        <TerminalCard
          title="Order cancelled"
          detail="This checkout was cancelled and nothing was charged. Pick a plan again from the billing page whenever you're ready."
          timestamp={order.cancelled_at}
          total={order.total}
          workspaceDomain={active.domain}
        />
      </div>
    );
  }

  if (order.status === "expired") {
    return (
      <div className="flex min-h-full flex-col">
        <Banner
          title="Review your order"
          description={`This order for ${active.name} has expired.`}
        />
        <div className="flex min-h-full flex-col">
          <TerminalCard
            title="Order expired"
            detail="This checkout was left open past its deadline and has expired. No payment was taken."
            timestamp={order.expires_at}
            total={order.total}
            workspaceDomain={active.domain}
          />
        </div>
      </div>
    );
  }

  const planNanoid = order.items?.[0]?.product?.nanoid ?? null;
  const plan = planNanoid ? await getPlan(planNanoid).catch(() => null) : null;

  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-10 text-center">
        <h1 className="text-xl font-semibold">Plan not found</h1>
        <p className="text-sm text-muted-foreground">
          The plan on this order is no longer available.
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

  const org = await getOrganization(
    active.client_business,
    active.domain,
  ).catch(() => null);
  if (!org) {
    throw new Error("Organization not found");
  }

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Review your order"
        description={`Your ${plan.label} solution for ${active.name}. Tune each line's quantity or remove it, then confirm and pay.`}
      />
      <CheckoutClient
        order={order}
        plan={plan}
        workspaceDomain={active.domain}
        organization={org}
      />
    </div>
  );
}