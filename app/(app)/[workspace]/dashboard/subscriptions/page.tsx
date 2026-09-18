import Link from "next/link";
import { CreditCard, Package, ShieldCheck, TableProperties } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAuth, requireWorkspace } from "@/lib/auth/server";
import { listPlans, listSubscriptions } from "@/lib/api";

/**
 * Subscriptions console — Overview (default landing).
 *
 * Server Component. The shell renders the banner + inner nav (the URL-backed
 * tab bar: Overview · Subscriptions · Plans). This page is the dashboard
 * snapshot: counts of plans and subscriptions with quick links into each tab.
 */
export default async function SubscriptionsOverview({
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
  const subscriptions = canManage
    ? await listSubscriptions().catch(() => [])
    : [];

  const activePlans = plans.filter((p) => p.is_active).length;
  const activeSubs = subscriptions.filter((s) => s.status === "active").length;
  const pastDueSubs = subscriptions.filter((s) => s.status === "past_due").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A snapshot of the plan catalog and organization subscriptions.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Plans"
          value={plans.length}
          icon={Package}
          hint={`${activePlans} active`}
        />
        <Stat
          label="Active plans"
          value={activePlans}
          icon={ShieldCheck}
          hint="Visible to customers"
        />
        <Stat
          label="Subscriptions"
          value={subscriptions.length}
          icon={TableProperties}
          hint={`${activeSubs} active`}
        />
        <Stat
          label="Past due"
          value={pastDueSubs}
          icon={CreditCard}
          hint={pastDueSubs === 0 ? "Nothing to chase" : "Action needed"}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={`${basePath}/subscriptions`}>View subscriptions</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`${basePath}/plans`}>Manage plans</Link>
        </Button>
        {canManage ? (
          <Button asChild size="sm" variant="secondary">
            <Link href={`${basePath}/plans/new`}>New plan</Link>
          </Button>
        ) : null}
      </div>

      {!canManage ? (
        <Card className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Only platform admins can edit plans and subscriptions. The catalog
          below is read-only.
        </Card>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  icon: typeof Package;
  hint: string;
}) {
  return (
    <Card className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}