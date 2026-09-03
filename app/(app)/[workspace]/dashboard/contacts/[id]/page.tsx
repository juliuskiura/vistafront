import Link from "next/link";

import { getContact } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Contact detail (Server Component).
 */
export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);
  const contact = await getContact(id, active.domain).catch(() => null);

  if (!contact) {
    return (
      <div className="max-w-3xl">
        <Link
          href={`/${active.domain}/dashboard/contacts`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Contacts
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Contact not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The contact you're looking for may have been deleted.
        </p>
      </div>
    );
  }

  const fullName = `${contact.first_name} ${contact.last_name}`.trim();

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={`/${active.domain}/dashboard/contacts`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Contacts
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{fullName || contact.email}</h1>
        <p className="text-sm text-muted-foreground">
          {contact.position ? `${contact.position} at ${contact.company_name}` : contact.company_name}
        </p>
      </div>

      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Email" value={contact.email} />
            <Field label="Phone" value={contact.phone ?? ""} />
            <Field
              label="Status"
              value={
                <Badge
                  variant={
                    contact.status === "active"
                      ? "default"
                      : contact.status === "lead"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {contact.status[0].toUpperCase() + contact.status.slice(1)}
                </Badge>
              }
            />
            <Field
              label="Company"
              value={
                <Link
                  href={`/${active.domain}/dashboard/companies/${contact.company}`}
                  className="text-primary hover:underline"
                >
                  {contact.company_name}
                </Link>
              }
            />
            {typeof contact.deal_count === "number" ? (
              <Field
                label="Deals"
                value={`${contact.deal_count}`}
              />
            ) : null}
            <Field
              label="Added"
              value={new Date(contact.created_at).toLocaleDateString()}
            />
          </dl>
        </CardContent>
      </Card>

      {contact.notes ? (
        <Card className="rounded-xl border bg-card">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm">{contact.notes}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}