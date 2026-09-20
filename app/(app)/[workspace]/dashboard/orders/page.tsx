import Link from "next/link";

import { listOrders, type Order } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { Card } from "@/components/ui/card";
import { ArrowRight, Clock, PackageCheck } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";

const STATUS_STYLES: Record<Order["status"], string> = {
  draft: "bg-border/60 text-muted-foreground",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  confirmed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  expired: "bg-border/60 text-muted-foreground",
};

function displayCurrency(currency: string): string {
  return currency.toUpperCase() === "KSH" ? "KES" : currency || "KES";
}

function formatKES(value: number | string): string {
  return `KES ${Number(value ?? 0).toLocaleString()}`;
}

function OrderCard({
  order,
  workspaceDomain,
}: {
  order: Order;
  workspaceDomain: string;
}) {
  const count = order.items?.length ?? 0;

  return (
    <Card className="rounded-xl border bg-card transition-colors hover:border-primary/40">
      <Link
        href={`/${workspaceDomain}/dashboard/orders/${order.nanoid}`}
        className="group flex w-full items-center justify-between gap-4 p-4 md:p-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PackageCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-bold text-foreground">
                {order.refid}
              </p>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[order.status] ?? "bg-border/60 text-muted-foreground"}`}
              >
                {order.status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {count} {count === 1 ? "item" : "items"} ·{" "}
              {displayCurrency(order.currency)}
              {order.created_at && ` · issued ${formatMediumDate(order.created_at)}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-extrabold text-foreground">
              {formatKES(order.total)}
            </p>
            {order.next_billing_date && (
              <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatMediumDate(order.next_billing_date)}
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
            Review
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </Card>
  );
}

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const orders = await listOrders({ workspace: active.domain }).catch(() => []);
  const sorted = [...orders].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
      new Date(a.created_at ?? 0).getTime(),
  );

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Your orders"
        description={`Checkout drafts and completed orders for ${active.name}. Pick any order to review it and continue to payment.`}
      />

      <div className="mx-auto w-full max-w-5xl py-6">
        {sorted.length === 0 ? (
          <Card className="rounded-xl border bg-card p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PackageCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-sm font-bold text-foreground">
              No orders yet
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              When you pick a plan from the billing page, an order appears here
              with its checkout flow ready to continue.
            </p>
            <Link
              href={`/${active.domain}/dashboard/billing`}
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95"
            >
              Choose a plan
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {sorted.map((order) => (
              <OrderCard
                key={order.nanoid}
                order={order}
                workspaceDomain={active.domain}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}