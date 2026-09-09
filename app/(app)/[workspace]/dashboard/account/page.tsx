import { getOrganization } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { AccountForm } from "@/app/(app)/[workspace]/dashboard/account/account-form";

export default async function AccountSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const org = await getOrganization(active.client_business, active.domain).catch(() => null);
  if (!org) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold">Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not load your organization details. Please try again in a moment.
        </p>
      </div>
    );
  }

  return <AccountForm org={org} workspaceDomain={active.domain} />;
}