import Link from "next/link";

import {
  getDeliverable,
  getProject,
  listCompanies,
  listContacts,
  listDeliverables,
  listTasks,
  listWorkspaceMembers,
  type Company,
  type Contact,
  type Deliverable,
  type DeliverableSummary,
  type Project,
  type Task,
  type WorkspaceMember,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { formatMediumDate } from "@/lib/dates";
import { Banner } from "@/components/banner";
import { ProjectRecord } from "./project-record";

/** The tabs the record offers, in order. */
const VALID_TABS = ["overview", "deliverables", "tasks"] as const;

type ProjectTab = (typeof VALID_TABS)[number];

/**
 * Project record (Server Component).
 *
 * Reads `?tab=` (default `overview`) and fetches the project plus the data
 * the active tab needs. The tab lives in the URL so the view survives a
 * refresh and can be shared.
 */
export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { workspace: slug, id } = await params;
  const sp = await searchParams;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "projectmanager.projects");

  let project: Project;
  try {
    project = await getProject(id, active.domain);
  } catch (error) {
    console.error("ProjectDetailPage: could not load project", error);
    return (
      <div className="max-w-3xl space-y-4">
        <Link
          href={`/${active.domain}/dashboard/projects`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back to projects
        </Link>
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          We couldn&apos;t load this project. It may have been removed or you
          may no longer have access.
        </div>
      </div>
    );
  }

  const requestedTab = (sp.tab ?? "overview").trim();
  const activeTab: ProjectTab = (VALID_TABS as readonly string[]).includes(
    requestedTab,
  )
    ? (requestedTab as ProjectTab)
    : "overview";

  // The picker data every tab can need: the members who can be assigned a
  // task or a deliverable, the companies and contacts the project form
  // offers, and the project's own deliverables and tasks.
  const [members, companies, contacts, deliverableSummaries, tasks] =
    await Promise.all([
      listWorkspaceMembers(active.nanoid, active.domain).catch(
        () => [] as WorkspaceMember[],
      ),
      listCompanies({
        filters: { page_size: 100 },
        workspace: active.domain,
      }).catch(() => [] as Company[]),
      listContacts({ workspace: active.domain }).catch(() => [] as Contact[]),
      listDeliverables({ project: project.nanoid, workspace: active.domain }).catch(
        () => [] as DeliverableSummary[],
      ),
      listTasks({ project: project.nanoid, workspace: active.domain }).catch(
        () => [] as Task[],
      ),
    ]);

  // The list endpoint returns slimmer rows than the detail endpoint: no
  // assignee, no review notes, and no nested tasks. The deliverables tab
  // shows all three, so the details are fetched for that tab only — the
  // other tabs read the summary plus the project's task list.
  const deliverableRows: Array<{
    summary: DeliverableSummary;
    detail: Deliverable | null;
  }> = await Promise.all(
    activeTab === "deliverables"
      ? deliverableSummaries.map(async (summary) => {
          try {
            const detail = await getDeliverable(summary.nanoid, active.domain);
            return { summary, detail };
          } catch {
            return { summary, detail: null };
          }
        })
      : [],
  );

  const memberOptions = members.map((member) => ({
    nanoid: member.user_nanoid,
    name: [member.first_name, member.last_name].filter(Boolean).join(" ") ||
      member.email,
  }));

  const companyOptions = companies.map((company) => ({
    nanoid: company.nanoid,
    name: company.name,
  }));

  const clientOptions = contacts.map((contact) => ({
    nanoid: contact.nanoid,
    name: `${contact.first_name} ${contact.last_name}`.trim(),
  }));

  const deliverableOptions = deliverableSummaries.map((deliverable) => ({
    nanoid: deliverable.nanoid,
    name: deliverable.title,
  }));

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title={project.name}
        description={
          [
            project.company_name ?? "No company",
            project.client_name,
            project.deadline ? `Due ${formatMediumDate(project.deadline)}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || `Project in ${active.name}`
        }
      />
      <div className="mt-6 flex-1">
        <ProjectRecord
          project={project}
          workspaceDomain={active.domain}
          activeTab={activeTab}
          deliverables={deliverableRows}
          deliverableCount={deliverableSummaries.length}
          tasks={tasks}
          members={memberOptions}
          companies={companyOptions}
          clients={clientOptions}
          deliverableOptions={deliverableOptions}
        />
      </div>
    </div>
  );
}
