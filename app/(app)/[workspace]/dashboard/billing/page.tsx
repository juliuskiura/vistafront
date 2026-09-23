import {
  listPlans,
  getSubscriptionState,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { PlansTab } from "./_components/plans-tab";

export default async function PlansPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const [plans, subscription] = await Promise.all([
    listPlans().catch(() => []),
    getSubscriptionState({ workspace: active.nanoid }).catch(() => ({
      subscription: null,
      features: [],
      exempt: false,
    })),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PlansTab
        plans={plans}
        subscription={subscription}
        workspaceName={active.name}
        workspaceDomain={active.domain}
        clientBusinessNanoid={active.client_business}
      />
    </div>
  );
}