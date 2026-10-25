import { getProject, listCompanies, listContacts } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { ProjectDetailShell } from "./project-shell";

export default async function ProjectDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "projectmanager.projects");

  const [project, companies, contacts] = await Promise.all([
    getProject(id, active.domain),
    listCompanies({ filters: { page_size: 100 }, workspace: active.domain }).catch(() => []),
    listContacts({ workspace: active.domain }).catch(() => []),
  ]);

  const companyOptions = companies.map((c: any) => ({ nanoid: c.nanoid, name: c.name }));
  const clientOptions = contacts.map((c: any) => ({ nanoid: c.nanoid, name: `${c.first_name} ${c.last_name}`.trim() }));

  return (
    <ProjectDetailShell
      workspaceDomain={active.domain}
      project={project}
      companies={companyOptions}
      clients={clientOptions}
    >
      {children}
    </ProjectDetailShell>
  );
}
