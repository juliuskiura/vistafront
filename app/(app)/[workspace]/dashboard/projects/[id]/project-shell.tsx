import { ArrowLeft } from "@/lib/icons";
import { Banner } from "@/components/banner";
import { formatMediumDate } from "@/lib/dates";

interface Props {
  children: React.ReactNode;
  workspaceDomain: string;
  project: {
    nanoid: string;
    name: string;
    description?: string | null;
    company_name?: string | null;
    deadline?: string | null;
  };
}

export function ProjectDetailShell({
  children,
  workspaceDomain,
  project,
}: Props) {
  const basePath = `/${workspaceDomain}/dashboard/projects`;

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title={project.name}
        description={
          [
            project.company_name ?? "No company",
            project.deadline ? `Due ${formatMediumDate(project.deadline)}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Project details"
        }
        actions={[
          {
            label: "Back to Projects",
            icon: ArrowLeft,
            href: basePath,
          },
        ]}
      />
      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}
