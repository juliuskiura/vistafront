import Link from "next/link";
import { Package, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAuth, requireWorkspace } from "@/lib/auth/server";
import { listPlans, listRegistryFeatures } from "@/lib/api";
import { PlansClient } from "./plans-client";

export default async function PlansPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const user = await requireAuth();

  const canManage = user.is_admin;
  const basePath = `/${active.domain}/dashboard/subscriptions`;

  const plans = await listPlans().catch(() => []);
  const featureOptions = canManage
    ? await listRegistryFeatures().catch(() => [])
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan tiers define what each organization can access, priced
            monthly.
          </p>
        </div>
        {canManage ? (
          <Button asChild size="sm">
            <Link href={`${basePath}/plans/new`}>
              <Plus className="size-4" />
              New plan
            </Link>
          </Button>
        ) : null}
      </header>

      {canManage ? (
        <PlansClient plans={plans} featureOptions={featureOptions} />
      ) : (
        <PlansReadonly />
      )}
    </div>
  );
}

function PlansReadonly() {
  return (
    <Card className="rounded-xl border bg-card p-8 text-center">
      <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Package className="size-5" />
      </div>
      <h2 className="text-base font-semibold">Admins manage this console</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Only platform admins can edit the plan catalog or organization
        subscriptions.
      </p>
    </Card>
  );
}