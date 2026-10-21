import Link from "next/link";

import {
  getDeliverable,
  listComments,
  listDeliverables,
  listWorkspaceMembers,
  type Comment,
  type Deliverable,
  type DeliverableSummary,
  type WorkspaceMember,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { formatMediumDate } from "@/lib/dates";
import { Banner } from "@/components/banner";
import { DeliverableRecord } from "./deliverable-record";

/**
 * Deliverable record (Server Component).
 *
 * The deliverable's own page lives outside the project's route tree
 * because the backend addresses deliverables directly — the old app
 * linked to `/dashboard/deliverables/:id` from the project record and
 * from the task page.
 */
export default async function DeliverableDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "projectmanager.deliverables");

  let deliverable: Deliverable;
  try {
    deliverable = await getDeliverable(id, active.domain);
  } catch (error) {
    console.error("DeliverableDetailPage: could not load deliverable", error);
    return (
      <div className="max-w-3xl space-y-4">
        <Link
          href={`/${active.domain}/dashboard/projects`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back to projects
        </Link>
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          We couldn&apos;t load this deliverable. It may have been removed or
          you may no longer have access.
        </div>
      </div>
    );
  }

  const [comments, members, deliverables] = await Promise.all([
    listComments("deliverable", deliverable.nanoid, active.domain).catch(
      () => [] as Comment[],
    ),
    listWorkspaceMembers(active.nanoid, active.domain).catch(
      () => [] as WorkspaceMember[],
    ),
    listDeliverables({
      project: deliverable.project,
      workspace: active.domain,
    }).catch(() => [] as DeliverableSummary[]),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title={deliverable.title}
        description={
          [
            deliverable.project_name ?? "No project",
            deliverable.due_date
              ? `Due ${formatMediumDate(deliverable.due_date)}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")
        }
      />
      <div className="mt-6 flex-1">
        <DeliverableRecord
          deliverable={deliverable}
          workspaceDomain={active.domain}
          comments={comments}
          members={members.map((member) => ({
            nanoid: member.user_nanoid,
            name:
              [member.first_name, member.last_name].filter(Boolean).join(" ") ||
              member.email,
          }))}
          deliverables={deliverables.map((row) => ({
            nanoid: row.nanoid,
            name: row.title,
          }))}
        />
      </div>
    </div>
  );
}
