import Link from "next/link";

import { getPlanByNanoid } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { PlanInvoiceClient } from "./plan-invoice-client";

export default async function PlanInvoicePage({
  params,
}: {
  params: Promise<{ workspace: string; nanoid: string }>;
}) {
  const { workspace: slug, nanoid } = await params;
  const active = await requireWorkspace(slug);

  const plan = await getPlanByNanoid(nanoid, {
    workspace: active.domain,
  }).catch(() => null);

  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-10 text-center">
        <h1 className="text-xl font-semibold">Plan not found</h1>
        <p className="text-sm text-muted-foreground">
          The plan you selected is no longer available or the link is invalid.
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

  return (
    <PlanInvoiceClient
      plan={plan}
      workspaceDomain={active.domain}
      workspaceName={active.name}
    />
  );
}