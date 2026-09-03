import { listBillingProfiles, type BillingProfile } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Billing (Server Component).
 *
 * Read-only list of billing profiles for the active workspace. Edit is a
 * placeholder for now — once the backend exposes a billing-profile update
 * endpoint, wire it through a Server Action here.
 */
export default async function BillingPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const profiles: BillingProfile[] = await listBillingProfiles().catch(
    () => [],
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Billing contact and payment details for {active.name}.
        </p>
      </div>

      {profiles.length === 0 ? (
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No billing profile is on file yet.
        </Card>
      ) : (
        profiles.map((profile) => <ProfileCard key={profile.nanoid} profile={profile} />)
      )}
    </div>
  );
}

function ProfileCard({ profile }: { profile: BillingProfile }) {
  return (
    <Card className="rounded-xl border bg-card">
      <CardHeader>
        <CardTitle>{profile.billing_contact_name || "Billing contact"}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Billing email" value={profile.billing_email} />
          <Field label="Tax ID" value={profile.tax_id} />
          <Field label="Country" value={profile.country} />
          <Field label="City" value={profile.city} />
          <Field label="Location" value={profile.location} full />
          <Field
            label="Payment method note"
            value={profile.payment_method_note}
            full
          />
          <Field
            label="Last updated"
            value={new Date(profile.updated_at).toLocaleString()}
            full
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}