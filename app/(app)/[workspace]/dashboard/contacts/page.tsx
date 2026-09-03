import Link from "next/link";

import { listContacts, type Contact } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/**
 * Contacts list (Server Component).
 *
 * Server-side search via `searchParams.search`. The list is filtered by
 * Django when `search` is set; otherwise it returns the unfiltered list.
 */
export default async function ContactsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ search?: string }>;
}) {
  const { workspace: slug } = await params;
  const { search } = await searchParams;
  const active = await requireWorkspace(slug);

  // Backend doesn't currently support ?search= for contacts; we filter on
  // the server instead. Keep it cheap — paginate later if needed.
  const all = await listContacts({ workspace: active.domain }).catch(
    () => [] as Contact[],
  );
  const q = (search ?? "").trim().toLowerCase();
  const contacts = q
    ? all.filter((c) =>
        [
          c.first_name,
          c.last_name,
          c.email,
          c.position ?? "",
          c.company_name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : all;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          People in your CRM for {active.name}.
        </p>
      </div>

      <form className="flex gap-2" method="get">
        <input
          type="search"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search contacts…"
          className="flex h-9 w-full max-w-sm rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-lg border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
        >
          Search
        </button>
        {q ? (
          <Link
            href={`/${active.domain}/dashboard/contacts`}
            className="inline-flex h-9 items-center text-xs text-muted-foreground hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {contacts.length === 0 ? (
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          {q
            ? `No contacts match "${search}".`
            : "No contacts yet. Add one from the CRM."}
        </Card>
      ) : (
        <Card className="divide-y rounded-xl border bg-card">
          {contacts.map((c) => (
            <ContactRow
              key={c.nanoid}
              contact={c}
              workspaceDomain={active.domain}
            />
          ))}
        </Card>
      )}
    </div>
  );
}

function ContactRow({
  contact,
  workspaceDomain,
}: {
  contact: Contact;
  workspaceDomain: string;
}) {
  const fullName = `${contact.first_name} ${contact.last_name}`.trim();
  return (
    <Link
      href={`/${workspaceDomain}/dashboard/contacts/${contact.nanoid}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {(contact.first_name[0] ?? contact.email[0] ?? "?").toUpperCase()}
        {(contact.last_name?.[0] ?? "").toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{fullName || contact.email}</p>
        <p className="truncate text-xs text-muted-foreground">
          {contact.position ? `${contact.position} · ` : ""}
          {contact.company_name}
        </p>
      </div>
      {typeof contact.deal_count === "number" ? (
        <span className="text-xs text-muted-foreground">
          {contact.deal_count} {contact.deal_count === 1 ? "deal" : "deals"}
        </span>
      ) : null}
      <StatusBadge status={contact.status} />
    </Link>
  );
}

function StatusBadge({ status }: { status: Contact["status"] }) {
  const variant =
    status === "active" ? "default" : status === "lead" ? "secondary" : "outline";
  const label =
    status === "active" ? "Active" : status === "lead" ? "Lead" : "Inactive";
  return <Badge variant={variant}>{label}</Badge>;
}