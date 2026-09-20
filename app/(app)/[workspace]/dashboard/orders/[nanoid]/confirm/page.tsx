import Link from "next/link";

import {
  getOrder,
  getPlan,
  getOrganization,
  listPaymentMethods,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { PaymentCheckoutClient } from "./payment-checkout-client";

export default async function OrderConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string; nanoid: string }>;
  searchParams: Promise<{ items?: string }>;
}) {
  const { workspace: slug, nanoid } = await params;
  const sp = await searchParams;
  const keptItemNanoids = sp.items
    ? sp.items
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : undefined;

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

  const paymentMethods = await listPaymentMethods(
    { workspace: active.domain },
    active.client_business,
  ).catch(() => []);

  return (
    <div className="relative isolate flex min-h-full flex-col text-foreground selection:bg-primary/20 selection:text-primary transition-colors duration-300">
      <Banner
        title="Confirm your payment"
        description={`Settle the ${plan.label} invoice for ${active.name} securely. Card, M-PESA, or PayPal.`}
      />  
      <PaymentCheckoutClient
        order={order}
        plan={plan}
        paymentMethods={paymentMethods}
        workspaceName={active.name}
        organization={org}
        keptItemNanoids={keptItemNanoids}
      />
    </div>
  );
}