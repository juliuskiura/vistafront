import { getPersonalDetails } from "@/lib/api";
import { requireAuth } from "@/lib/auth/server";
import { AccountForm } from "@/app/(app)/[workspace]/dashboard/account/account-form";

/**
 * Account settings (Server Component).
 *
 * Always-available because the user can edit their own details from any
 * workspace they belong to. Reads personal details on the server and hands
 * them to the form Client Component.
 */
export default async function AccountSettingsPage() {
  // The (app) layout already gated on auth; this is a defensive double-check.
  await requireAuth();

  const details = await getPersonalDetails().catch(() => null);
  if (!details) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold">Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not load your account details. Please try again in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">
          Personal details linked to your account. These are visible to
          everyone in your workspaces.
        </p>
      </div>
      <AccountForm details={details} />
    </div>
  );
}