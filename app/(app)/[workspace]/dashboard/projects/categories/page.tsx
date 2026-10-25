import { listProjectCategories } from "@/lib/api/projectmanager/project-categories";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { Banner } from "@/components/banner";
import { CategoryTaxonomyStudio } from "./_components/category-taxonomy-studio";

/**
 * Category taxonomy studio (Server Component).
 *
 * Lists all project categories in the workspace and hands them to a client
 * component for create / update / delete.
 */
export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "projectmanager.projects");

  const categories = await listProjectCategories(active.domain).catch(
    () => [] as Array<{
      nanoid: string;
      name: string;
      key: string;
      description: string;
      color: string;
      is_active: boolean;
      position: number;
    }>,
  );

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Category taxonomy"
        description="Classify projects with workspace-defined categories."
      />
      <div className="mt-6 flex-1">
        <CategoryTaxonomyStudio
          categories={categories}
          workspaceDomain={active.domain}
        />
      </div>
    </div>
  );
}
