import Link from "next/link";

import {
  getTask,
  listAttachments,
  listComments,
  listWorkspaceMembers,
  type Attachment,
  type Comment,
  type Task,
  type WorkspaceMember,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { formatMediumDate } from "@/lib/dates";
import { Banner } from "@/components/banner";
import { TaskRecord } from "./task-record";

/**
 * Task record (Server Component).
 *
 * The route lives under `projects/` because that is where the old app
 * put it (`/dashboard/projects/tasks/:id`) and where the project record
 * links to it.
 */
export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "projectmanager.tasks");

  let task: Task;
  try {
    task = await getTask(id, active.domain);
  } catch (error) {
    console.error("TaskDetailPage: could not load task", error);
    return (
      <div className="max-w-3xl space-y-4">
        <Link
          href={`/${active.domain}/dashboard/projects`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back to projects
        </Link>
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          We couldn&apos;t load this task. It may have been removed or you may
          no longer have access.
        </div>
      </div>
    );
  }

  const [comments, attachments, members] = await Promise.all([
    listComments("task", task.nanoid, active.domain).catch(
      () => [] as Comment[],
    ),
    listAttachments("task", task.nanoid, active.domain).catch(
      () => [] as Attachment[],
    ),
    listWorkspaceMembers(active.nanoid, active.domain).catch(
      () => [] as WorkspaceMember[],
    ),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title={task.title}
        description={
          [
            task.project_name ?? "No project",
            task.due_date ? `Due ${formatMediumDate(task.due_date)}` : null,
          ]
            .filter(Boolean)
            .join(" · ")
        }
      />
      <div className="mt-6 flex-1">
        <TaskRecord
          task={task}
          workspaceDomain={active.domain}
          comments={comments}
          attachments={attachments}
          members={members.map((member) => ({
            nanoid: member.user_nanoid,
            name:
              [member.first_name, member.last_name].filter(Boolean).join(" ") ||
              member.email,
          }))}
          projects={[{ nanoid: task.project ?? "", name: task.project_name ?? "Untitled project" }]}
        />
      </div>
    </div>
  );
}
