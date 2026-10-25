import { getProject, listAllProjects, listTasks } from "@/lib/api";
import { listProjectCategories } from "@/lib/api/projectmanager";
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

  const [{ projects: summaries, total, truncated }, tasks, categories] =
    await Promise.all([
      listAllProjects({ workspace: active.domain }),
      listTasks({ workspace: active.domain }).catch(() => [] as Task[]),
      listProjectCategories(active.domain).catch(() => []),
    ]);

  const projects: Awaited<ReturnType<typeof getProject>>[] = await Promise.all(
    summaries.map(async (p) => {
      try {
        return await getProject(p.nanoid, active.domain);
      } catch {
        return {
          ...p,
          description: "",
          start_date: null,
          updated_at: p.created_at,
        } as Awaited<ReturnType<typeof getProject>>;
      }
    }),
  );

  return (
    <div className="flex-1">
      <ProjectsList
        projects={projects}
        tasks={tasks}
        categories={categories}
        workspaceDomain={active.domain}
        total={total}
        truncated={truncated}
      />
    </div>
  );
}
