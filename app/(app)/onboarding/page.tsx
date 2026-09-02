import Link from "next/link";

import { listWorkspaces } from "@/lib/api";
import { getAuthUser } from "@/lib/auth/server";
import { OnboardingHomeClient } from "@/components/onboarding/onboarding-home-client";

/**
 * Onboarding home (Server Component).
 *
 * Branches the UI based on what we know about the signed-in user:
 *  - has at least one workspace → show "Open your workspace" + a switcher
 *  - no workspaces → show "Create a business" / "Join with a code" CTAs
 */
export default async function OnboardingHomePage() {
  const [user, workspaces] = await Promise.all([
    getAuthUser(),
    listWorkspaces().catch(() => []),
  ]);

  const hasWorkspace = workspaces.length > 0;
  const firstName = user?.first_name?.trim() || user?.email?.split("@")[0] || "there";

  return (
    <OnboardingHomeClient
      firstName={firstName}
      hasWorkspace={hasWorkspace}
      workspaces={workspaces.map((ws) => ({
        nanoid: ws.nanoid,
        name: ws.name,
        domain: ws.domain,
      }))}
    />
  );
}
