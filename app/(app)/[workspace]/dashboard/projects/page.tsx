import { listAllProjects, listTasks } from "@/lib/api";
import type { Task } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { Banner } from "@/components/banner";
import { ProjectsList } from "./projects-list";

/**
 * The projects list (Server Component).
 *
 * The whole set is fetched, not just the first page: the backend applies
 * no filtering to projects, so the search and the status/priority filters
 * run in the browser over everything that is here. A single 25-row page
 * would have hidden every project past the 25th.
 *
 * Tasks are fetched alongside projects so the kanban view can render all
 * workspace tasks grouped by status.
 */
export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "projectmanager.projects");

  const [{ projects, total, truncated }, tasks] = await Promise.all([
    listAllProjects({ workspace: active.domain }),
    listTasks({ workspace: active.domain }).catch(() => [] as Task[]),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Projects"
        description="Every project in this workspace, with its progress at a glance."
      />
      <div className="mt-6 flex-1">
        <ProjectsList
          projects={projects}
          tasks={tasks}
          workspaceDomain={active.domain}
          total={total}
          truncated={truncated}
        />
      </div>
    </div>
  );
}
