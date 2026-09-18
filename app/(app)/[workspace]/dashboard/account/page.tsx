import { getPersonalDetails } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { UserAccountForm } from "@/app/(app)/[workspace]/dashboard/account/user-account-form";

export default async function AccountSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  await requireWorkspace(slug);
  const personalDetails = await getPersonalDetails().catch(() => null);
  if (!personalDetails) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold">Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not load your personal details. Please try again in a moment.
        </p>
      </div>
    );
  }

  return <UserAccountForm personalDetails={personalDetails} />;
}