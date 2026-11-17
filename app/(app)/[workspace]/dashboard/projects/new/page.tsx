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

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="New project"
        description="Give the work a name, pick the company it belongs to, and set how it should be handled."
      />
      <div className="mt-6 flex-1">
        <NewProjectForm
          workspaceDomain={active.domain}
        />
      </div>
    </div>
  );
}
