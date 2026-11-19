import Link from "next/link";

import {
  getTask,
  listAttachments,
  listComments,
  listTasks,
  listWorkspaceMembers,
  listNotes,
  listNoteTypes,
  type Attachment,
  type Comment,
  type Task,
  type WorkspaceMember,
  type Note,
  type NoteTypeOption,
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

  const [comments, attachments, members, allProjectTasks, notes] = await Promise.all([
    listComments("task", task.nanoid, active.domain).catch(
      () => [] as Comment[],
    ),
    listAttachments("task", task.nanoid, active.domain).catch(
      () => [] as Attachment[],
    ),
    listWorkspaceMembers(active.nanoid, active.domain).catch(
      () => [] as WorkspaceMember[],
    ),
    task.project
      ? listTasks({ project: task.project, workspace: active.domain }).catch(
          () => [] as Task[],
        )
      : Promise.resolve([] as Task[]),
    listNotes({ relatable: "task", object_nanoid: task.nanoid, workspace: active.domain }).catch(
      () => [] as Note[],
    ),
  ]);

  const subtasks = allProjectTasks.filter(
    (candidate) => candidate.parent === task.nanoid,
  );

  return (
    <div className="flex-1">
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
        subtasks={subtasks}
        notes={notes}
      />
    </div>
  );
}
