import { redirect } from "next/navigation";

import { NewWorkspaceForm } from "@/components/onboarding/new-workspace-form";

/**
 * Create-workspace step (Server Component).
 *
 * Reads the `business` nanoid from the query string. If absent, redirects
 * back to the onboarding home (the user must register a business first).
 */
export default async function NewWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string }>;
}) {
  const { business } = await searchParams;
  if (!business) {
    redirect("/onboarding");
  }
  return <NewWorkspaceForm business={business} />;
}
