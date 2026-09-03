import { listInvoices, listPayments, listPaymentMethods, listPlans, getSubscription } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { BillingClient } from "./billing-client";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const [invoices, payments, plans, subscription] = await Promise.all([
    listInvoices({ workspace: active.domain }).catch(() => []),
    listPayments({ workspace: active.domain }).catch(() => []),
    listPlans({ workspace: active.domain }).catch(() => []),
    getSubscription({ workspace: active.domain }).catch(() => null),
  ]);

  return (
    <BillingClient
      invoices={invoices}
      payments={payments}
      plans={plans}
      subscription={subscription}
      workspaceName={active.name}
      workspaceDomain={active.domain}
    />
  );
}
