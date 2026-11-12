import { redirect } from "next/navigation";

import { Banner } from "@/components/banner";
import { getAuthUser, requireWorkspace } from "@/lib/auth/server";
import { listApplications } from "@/lib/api/applications";
import type { Application } from "@/lib/api/types";
import { DeveloperClient } from "./developer-client";

/**
 * Developer console (Server Component).
 *
 * Console-admin-only workspace tooling for managing developer applications
 * and their API keys. The backend `DeveloperNavItem` is `console_admin_only =
 * True` with no subscription feature or resource gate, so the page enforces
 * `is_admin` itself and otherwise falls back to the dashboard root.
 */
export default async function DeveloperPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const user = await getAuthUser();
  if (!user || !user.is_admin) {
    redirect(`/${ws}/dashboard`);
  }

  const applications: Application[] = await listApplications(ws).catch(
    () => [],
  );

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Developer"
        description="Manage developer applications and API keys for machine-to-machine integrations."
      />

      <div className="mt-6 flex-1 px-4 md:px-6">
        <DeveloperClient applications={applications} workspace={ws} />
      </div>
    </div>
  );
}
