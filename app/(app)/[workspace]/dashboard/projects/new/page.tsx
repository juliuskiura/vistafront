import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
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

  return <NewProjectForm workspaceDomain={active.domain} />;
}
