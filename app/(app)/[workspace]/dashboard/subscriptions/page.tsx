import { requireAuth, requireWorkspace } from "@/lib/auth/server";
import {
  listClientBusinesses,
  listPlanApps,
  listPlans,
  listSubscriptions,
  type ClientBusiness,
  type Plan,
  type PlanApp,
  type Subscription,
} from "@/lib/api";
import { SubscriptionsClient } from "./subscriptions-client";

/**
 * Subscriptions console (Server Component).
 *
 * This route backs the sidebar's "Subscriptions" item, which the backend flags
 * as ``console_admin_only``. Platform admins land here to run CRUD over the
 * plan catalog (Plans + their ordered PlanFeatures and PlanApp bindings) and
 * every organization's Subscription. Reads are fetched through
 * ``lib/api/billing.ts`` → ``serverFetch``; all writes go through Server
 * Actions in ``./actions.ts``.
 */
export default async function SubscriptionsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const [active, user] = await Promise.all([
    requireWorkspace(slug),
    requireAuth(),
  ]);

  // The backend grants write access to platform admins (IsConsoleAdmin) and
  // resolves the "console" scope from the active workspace's domain. We mirror
  // that with the user's `is_admin` flag so the UI hides privileged controls
  // from non-admins even if they navigate here directly.
  const canManage = user.is_admin;

  const workspace = active.domain;
  const plans: Plan[] = await listPlans({ workspace }).catch(() => []);
  const subscriptions: Subscription[] = canManage
    ? await listSubscriptions({ workspace }).catch(() => [])
    : [];

  let planApps: PlanApp[] = [];
  let clientBusinesses: ClientBusiness[] = [];
  if (canManage) {
    [planApps, clientBusinesses] = await Promise.all([
      listPlanApps({ workspace }).catch(() => []),
      listClientBusinesses().catch(() => []),
    ]);
  }

  return (
    <SubscriptionsClient
      canManage={canManage}
      workspaceDomain={workspace}
      plans={plans}
      subscriptions={subscriptions}
      planApps={planApps}
      clientBusinesses={clientBusinesses}
    />
  );
}