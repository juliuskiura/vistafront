"use client";

import { useState, useEffect, useRef, useActionState } from "react";

import { FolderKanban, Plus, ListTodo, Layers, FileText, ChevronDown } from "@/lib/icons";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";
import { formatMediumDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Fab } from "@/components/ui/fab";
import { TaskForm } from "../forms/task-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RichTextEditor } from "@/components/editor";
import type { PickerOption } from "../forms/project-form";
import type { Task, NoteTypeOption } from "@/lib/api";
import { attachNoteAction } from "@/app/(app)/[workspace]/dashboard/notebook/actions";
import { NoteTypeDialog } from "@/app/(app)/[workspace]/dashboard/notebook/_components/note-type-dialog";

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
  tasks: Task[];
  members: PickerOption[];
  noteTypes: NoteTypeOption[];
}

export function ProjectDetailShell({
  children,
  workspaceDomain,
  project,
  tasks,
  members,
  noteTypes,
}: Props) {
  const basePath = `/${workspaceDomain}/dashboard/projects`;

  const [noteState, noteAction, notePending] = useActionState(
    attachNoteAction,
    { status: "idle" },
  );
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [subtaskParent, setSubtaskParent] = useState<Task | null>(null);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [headerOpen, setHeaderOpen] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (noteState.status === "success") {
      formRef.current?.reset();
      setNoteContent("");
      setNoteSheetOpen(false);
    }
  }, [noteState]);

  const projectOptions = [{ nanoid: project.nanoid, name: project.name }];

  const navItems: InnerNavItem[] = [
    {
      label: "Create New Project",
      href: `${basePath}/new`,
      icon: Plus,
    },
    {
      label: "Add Tasks",
      href: `${basePath}/${project.nanoid}?tab=tasks`,
      icon: ListTodo,
    },
    {
      label: "Add Subtasks",
      icon: Layers,
      onClick: () => setParentPickerOpen(true),
    },
    {
      label: "Attach a Note",
      icon: FileText,
      onClick: () => setNoteSheetOpen(true),
    },
  ];

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
      />
      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Project Manager"
        brandIcon={FolderKanban}
        items={navItems}
      />
      <div className="flex-1 p-4 md:p-6">{children}</div>

      <Dialog open={parentPickerOpen} onOpenChange={setParentPickerOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select parent task</DialogTitle>
            <DialogDescription>
              Choose the task that the new subtask will belong to.
            </DialogDescription>
          </DialogHeader>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tasks available. Add a task first.
            </p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {tasks
                .filter((t) => !t.parent && t.project === project.nanoid)
                .map((t) => (
                  <li key={t.nanoid}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setParentPickerOpen(false);
                        setSubtaskParent(t);
                      }}
                    >
                      {t.title}
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={subtaskParent !== null}
        onOpenChange={(open) => !open && setSubtaskParent(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add subtask</DialogTitle>
            <DialogDescription>
              A subtask belongs to “{subtaskParent?.title}”.
            </DialogDescription>
          </DialogHeader>
          {subtaskParent ? (
            <TaskForm
              workspaceDomain={workspaceDomain}
              projects={projectOptions}
              members={members}
              defaultProject={project.nanoid}
              defaultParent={subtaskParent.nanoid}
              defaultParentName={subtaskParent.title}
              defaultParentTaskId={subtaskParent.task_id}
              parentCreatedAt={subtaskParent.created_at}
              submitLabel="Add subtask"
              onSuccess={() => setSubtaskParent(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <Sheet open={noteSheetOpen} onOpenChange={setNoteSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[720px] lg:w-[960px] p-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Attach a Note</SheetTitle>
            <SheetDescription>
              Create a note attached to this project.
            </SheetDescription>
          </SheetHeader>
          <form ref={formRef} action={noteAction} className="space-y-4 p-4">
            <input type="hidden" name="workspace_domain" value={workspaceDomain} />
            <input type="hidden" name="project_nanoid" value={project.nanoid} />
            <input type="hidden" name="object_nanoid" value={project.nanoid} />
            <input type="hidden" name="relatable_key" value="project" />
            <input type="hidden" name="content" value={noteContent} />

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50"
              onClick={() => setHeaderOpen((v) => !v)}
            >
              <span>Note details</span>
              <ChevronDown
                className={`size-4 transition-transform ${headerOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div className={headerOpen ? "space-y-4" : "hidden"}>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Title</label>
                <input
                  name="title"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Type</label>
                <div className="flex items-end gap-2">
                  <select
                    name="note_type"
                    defaultValue={noteTypes[0]?.key ?? "general"}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {noteTypes.map((t) => (
                      <option key={t.nanoid} value={String(t.key)}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <Fab
                    size="sm"
                    variant="outline-primary"
                    onClick={() => setTypeDialogOpen(true)}
                    aria-label="Create new note type"
                  >
                    <Plus size={16} />
                  </Fab>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Content</label>
              <RichTextEditor
                value={noteContent}
                onChange={setNoteContent}
                placeholder="Write your note…"
              />
            </div>
            {noteState.status === "error" ? (
              <p className="text-sm text-destructive">{noteState.message}</p>
            ) : null}
            {noteState.status === "success" ? (
              <p className="text-sm text-green-600">{noteState.message}</p>
            ) : null}
            <Button type="submit" disabled={notePending}>
              {notePending ? "Attaching…" : "Attach note"}
            </Button>
          </form>
          <NoteTypeDialog
            open={typeDialogOpen}
            onOpenChange={setTypeDialogOpen}
            workspaceDomain={workspaceDomain}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}