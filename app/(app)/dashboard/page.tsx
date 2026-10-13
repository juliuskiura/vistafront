import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/server";

export default async function DashboardRedirectPage() {
  const user = await requireAuth();
  const destination = user.redirect_url ?? "/onboarding";
  const path = new URL(destination, "https://app.vistasolve.invalid").pathname;
  const [workspaceDomain, section] = path.split("/").filter(Boolean);

  if (!workspaceDomain || section !== "dashboard") {
    redirect("/onboarding");
  }

  redirect(`/${workspaceDomain}/dashboard`);
}