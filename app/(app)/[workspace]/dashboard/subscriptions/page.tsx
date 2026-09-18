import { requireAuth, requireWorkspace } from "@/lib/auth/server";
import {
  listClientBusinesses,
  listPlans,
  listRegistryFeatures,
  listSubscriptions,
  type ClientBusiness,
  type RegistryFeature,
  type SubsPlan,
  type Subscription,
} from "@/lib/api";
import { SubscriptionsClient } from "./subscriptions-client";

/**
 * Subscriptions console (Server Component).
 *
 * This route backs the sidebar's "Subscriptions" item, which the backend flags
 * as ``console_admin_only``. Platform admins land here to run CRUD over the
 * plan catalog (Plans + their PlanFeatures) and every organization's
 * Subscription. Reads are fetched through ``lib/api/subscriptions.ts`` →
 * ``serverFetch``; all writes go through Server Actions in ``./actions.ts``.
 */
export default async function SubscriptionsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  await requireWorkspace(slug);
  const user = await requireAuth();

  // The backend grants write access to platform admins (IsConsoleAdmin) and
  // resolves the "console" scope from the active workspace's domain. We mirror
  // that with the user's `is_admin` flag so the UI hides privileged controls
  // from non-admins even if they navigate here directly.
  const canManage = user.is_admin;

  const [plans, subscriptions, clientBusinesses, featureOptions]: [
    SubsPlan[],
    Subscription[],
    ClientBusiness[],
    RegistryFeature[],
  ] = await Promise.all([
    listPlans().catch(() => []),
    canManage ? listSubscriptions().catch(() => []) : Promise.resolve([]),
    canManage ? listClientBusinesses().catch(() => []) : Promise.resolve([]),
    canManage ? listRegistryFeatures().catch(() => []) : Promise.resolve([]),
  ]);

  return (
    <SubscriptionsClient
      canManage={canManage}
      plans={plans}
      subscriptions={subscriptions}
      clientBusinesses={clientBusinesses}
      featureOptions={featureOptions}
    />
  );
}