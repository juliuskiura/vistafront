import { redirect } from "next/navigation";

import { requireAuth, requireWorkspace } from "@/lib/auth/server";
import { listClientBusinesses } from "@/lib/api";
import { NewPlanForm } from "./new-plan-form";

export default async function NewPlanPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const user = await requireAuth();

  if (!user.is_admin) {
    redirect(`/${active.domain}/dashboard/subscriptions/plans`);
  }

  // Organizations for the visibility picker — what lets an admin turn a
  // plan into a private package scoped to one organization.
  const clientBusinesses = await listClientBusinesses().catch(() => []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">New plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a plan tier, then attach the features organizations unlock.
        </p>
      </header>

      <NewPlanForm clientBusinesses={clientBusinesses} workspace={active.domain} />
    </div>
  );
}