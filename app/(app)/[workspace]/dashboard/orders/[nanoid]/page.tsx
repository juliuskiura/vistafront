import Link from "next/link";

import { getOrder, getPlan, getOrganization } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { PlanInvoiceClient } from "./plan-invoice-client";

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
    <PlanInvoiceClient
      order={order}
      plan={plan}
      workspaceDomain={active.domain}
      workspaceName={active.name}
      organization={org}
    />
  );
}