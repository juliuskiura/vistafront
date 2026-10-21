import Link from "next/link";

import {
  getContact,
  listActivities,
  listDeals,
  type Activity,
  type Contact,
  type Deal,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { CrmInnerNav } from "@/components/crm";
import { ContactRecord } from "@/app/(app)/[workspace]/dashboard/contacts/[id]/contact-record";

/**
 * Contact detail (Server Component).
 *
 * Fetches the contact plus the activities and deals that reference it.
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
          The contact you are looking for may have been deleted.
        </p>
      </div>
    );
  }

  // An archived contact keeps its activities and deals — they are only
  // hidden from the working lists — so the record asks for them explicitly.
  const archived = contact.archived ? "all" : undefined;

  const [activities, allDeals] = await Promise.all([
    listActivities({
      contact: contact.nanoid,
      archived,
      workspace: active.domain,
    }).catch(() => [] as Activity[]),
    listDeals({ archived, workspace: active.domain }).catch(() => [] as Deal[]),
  ]);

  // The deal list endpoint has no `?contact=` filter, so the matching is
  // done here.
  const deals = allDeals.filter((d) => d.contact === contact.nanoid);

  const fullName = `${contact.first_name} ${contact.last_name}`.trim();

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title={fullName || contact.email}
        description={
          contact.position
            ? `${contact.position} at ${contact.company_name}`
            : contact.company_name
        }
      />
      <CrmInnerNav workspaceDomain={active.domain} />
      <div className="mt-6 flex-1">
        <ContactRecord
          contact={contact}
          workspaceDomain={active.domain}
          activities={activities}
          deals={deals}
        />
      </div>
    </div>
  );
}
