import { FolderKanban, ListTodo } from "@/lib/icons";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";
import type { PickerOption } from "../forms/project-form";

const NAV_ITEMS: InnerNavItem[] = [
  { label: "Projects", href: "", end: true, icon: FolderKanban },
  { label: "Tasks", href: "/tasks", icon: ListTodo },
];

interface Props {
  children: React.ReactNode;
  workspaceDomain: string;
  project: {
    nanoid: string;
    name: string;
    description?: string | null;
    company_name?: string | null;
    client_name?: string | null;
    deadline?: string | null;
  };
  companies: PickerOption[];
  clients: PickerOption[];
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
            project.client_name,
            project.deadline ? `Due ${project.deadline}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Project details"
        }
      />
      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Project"
        brandIcon={FolderKanban}
        items={NAV_ITEMS}
        hideBrand
      />
      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}
