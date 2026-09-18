import { redirect } from "next/navigation";

import { requireAuth, requireWorkspace } from "@/lib/auth/server";
import {
  listClientBusinesses,
  listPlans,
  listSubscriptions,
} from "@/lib/api";
import { SubscriptionsPanel } from "../_components/subscriptions-panel";

export default async function SubscriptionsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const user = await requireAuth();

  if (!user.is_admin) {
    redirect(`/${active.domain}/dashboard/subscriptions`);
  }

  const [subscriptions, plans, clientBusinesses] = await Promise.all([
    listSubscriptions().catch(() => []),
    listPlans().catch(() => []),
    listClientBusinesses().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every organization&apos;s current plan, status, and renewal period.
        </p>
      </header>

      <SubscriptionsPanel
        subscriptions={subscriptions}
        plans={plans}
        clientBusinesses={clientBusinesses}
      />
    </div>
  );
}