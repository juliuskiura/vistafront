"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, FolderKanban, ListTodo, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectForm } from "../forms/project-form";
import type { PickerOption } from "../forms/project-form";
import { deleteProjectAction } from "../actions/project-actions";

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
  companies,
  clients,
}: Props) {
  const router = useRouter();
  const basePath = `/${workspaceDomain}/dashboard/projects`;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trailing = (
    <div className="flex items-center gap-2">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 text-xs"
      >
        <Link href={basePath}>
          <FolderKanban className="size-3.5" />
          All Projects
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={() => setEditOpen(true)}
      >
        <Edit3 className="size-3.5" />
        Edit Project
      </Button>
      <Button
        asChild
        size="sm"
        className="h-8 text-xs bg-gradient-to-r from-primary-600 to-secondary-600 text-white"
      >
        <Link href={`${basePath}/new`}>
          <Plus className="size-3.5" />
          New Project
        </Link>
      </Button>
      <Button
        variant="destructive"
        size="sm"
        className="h-8 text-xs"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-3.5" />
        Delete
      </Button>
    </div>
  );

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
        trailing={trailing}
      />
      <div className="mt-6 flex-1">{children}</div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>Update the details of this project.</DialogDescription>
          </DialogHeader>
          <ProjectForm
            workspaceDomain={workspaceDomain}
            project={project as any}
            companies={companies}
            clients={clients}
            submitLabel="Save changes"
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this project?"
        description="This project and its tasks will be deleted. This cannot be undone."
        confirmLabel="Delete project"
        variant="destructive"
        onConfirm={async () => {
          const result = await deleteProjectAction({
            workspaceDomain,
            nanoid: project.nanoid,
          });
          if (result.status === "error") {
            setError(result.message ?? "The project could not be deleted.");
          } else {
            router.push(basePath);
          }
        }}
      />
      {error ? (
        <p className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
