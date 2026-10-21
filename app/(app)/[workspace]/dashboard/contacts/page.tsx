import {
  listCompanies,
  listContacts,
  type Company,
  type Contact,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { ContactsList } from "@/app/(app)/[workspace]/dashboard/contacts/contacts-list";

/**
 * How many contacts the page loads.
 *
 * The backend has no `?search=` for contacts and no server-side filter we
 * can combine with one, so the list is fetched whole and filtered in
 * memory. The cap keeps the page from pulling an unbounded set; when the
 * cap bites, the list says so rather than pretending to be complete.
 */
const CONTACT_FETCH_LIMIT = 500;

/**
 * Contacts list (Server Component).
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

  const [allContacts, companies] = await Promise.all([
    listContacts({ workspace: active.domain }).catch(() => [] as Contact[]),
    listCompanies({ workspace: active.domain }).catch(() => [] as Company[]),
  ]);

  const capped = allContacts.slice(0, CONTACT_FETCH_LIMIT);
  const q = (search ?? "").trim().toLowerCase();
  const contacts = q
    ? capped.filter((c) =>
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
    : capped;

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Contacts"
        description="The people you work with, and the companies they belong to."
      />
      <div className="mt-6 flex-1">
        <ContactsList
          contacts={contacts}
          companies={companies}
          workspaceDomain={active.domain}
          search={(search ?? "").trim()}
        />
      </div>
    </div>
  );
}
