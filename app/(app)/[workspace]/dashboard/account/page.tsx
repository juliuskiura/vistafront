import { getPersonalDetails } from "@/lib/api";
import { AccountForm } from "@/app/(app)/[workspace]/dashboard/account/account-form";

export default async function AccountSettingsPage() {
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

  return <AccountForm details={details} />;
}