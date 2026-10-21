import { listCompanies, listContacts, type Company, type Contact } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { Banner } from "@/components/banner";
import { NewProjectForm } from "./new-project-form";

/** The "new project" page. */
export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "projectmanager.projects");

  const [companies, contacts] = await Promise.all([
    listCompanies({
      filters: { page_size: 100 },
      workspace: active.domain,
    }).catch(() => [] as Company[]),
    listContacts({ workspace: active.domain }).catch(() => [] as Contact[]),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="New project"
        description="Give the work a name, pick the company it belongs to, and set how it should be handled."
      />
      <div className="mt-6 flex-1">
        <NewProjectForm
          workspaceDomain={active.domain}
          companies={companies.map((company) => ({
            nanoid: company.nanoid,
            name: company.name,
          }))}
          clients={contacts.map((contact) => ({
            nanoid: contact.nanoid,
            name: `${contact.first_name} ${contact.last_name}`.trim(),
          }))}
        />
      </div>
    </div>
  );
}
