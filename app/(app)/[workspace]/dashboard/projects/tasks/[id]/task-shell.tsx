"use client";

import { useState, useEffect, useRef, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Edit3,
  FileText,
  FolderKanban,
  GitBranch,
  ListTodo,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";
import { Button } from "@/components/ui/button";
import { Fab } from "@/components/ui/fab";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RichTextEditor } from "@/components/editor";
import { attachNoteAction } from "@/app/(app)/[workspace]/dashboard/notebook/actions";
import { NoteTypeDialog } from "@/app/(app)/[workspace]/dashboard/notebook/_components/note-type-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "../../forms/task-form";
import type { PickerOption } from "../../forms/project-form";
import { deleteTaskAction } from "../../actions/task-actions";

const NAV_ITEMS: InnerNavItem[] = [];

interface Props {
  children: React.ReactNode;
  workspaceDomain: string;
  task: any;
  members: PickerOption[];
  projects: PickerOption[];
  parentTask?: any;
  noteTypes?: any[];
  notes?: any[];
}

export function TaskDetailShell({
  children,
  workspaceDomain,
  task,
  members,
  projects,
  parentTask,
  noteTypes = [],
  notes = [],
}: Props) {
  const router = useRouter();
  const projectBase = task.project
    ? `/${workspaceDomain}/dashboard/projects/${task.project}`
    : `/${workspaceDomain}/dashboard/projects`;
  const basePath = `/${workspaceDomain}/dashboard/projects`;
  const taskBase = `/${workspaceDomain}/dashboard/projects/tasks`;
  const navItems: InnerNavItem[] = [
    {
      label: "Tasks",
      href: task.project ? `/${task.project}/tasks` : "/tasks",
      icon: ListTodo,
    },
  ];
  if (task.project) {
    navItems.push({
      label: "View Parent Project",
      href: `/${task.project}`,
      icon: FolderKanban,
    });
  }
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [subtaskOpen, setSubtaskOpen] = useState(false);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  navItems.push({
    label: `View Addon Notes${notes.length ? ` (${notes.length})` : ""}`,
    icon: FileText,
    onClick: () => setNotesSheetOpen(true),
  });
  const [noteContent, setNoteContent] = useState("");
  const [headerOpen, setHeaderOpen] = useState(true);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [noteState, noteAction, notePending] = useActionState(attachNoteAction, {
    status: "idle",
  });

  useEffect(() => {
    if (noteState.status === "success") {
      formRef.current?.reset();
      setNoteContent("");
      setNoteSheetOpen(false);
    }
  }, [noteState]);
  const [error, setError] = useState<string | null>(null);



  const actionsGroup = {
    label: "Actions",
    icon: Edit3,
    items: [
      ...(!task.parent
        ? [{ label: "Add SubTask", icon: Plus, onClick: () => setSubtaskOpen(true) }]
        : []),
      { label: "Edit Task", icon: Edit3, onClick: () => setEditOpen(true) },
      { label: "Assign Task", icon: UserPlus, onClick: () => setEditOpen(true) },
      {
        label: "Delete Task",
        icon: Trash2,
        destructive: true,
        onClick: () => setDeleteOpen(true),
      },
      {
        label: "Attach a Note",
        icon: FileText,
        onClick: () => setNoteSheetOpen(true),
      },
    ],
  };

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title={task.title}
        description={
          [
            task.project_name ?? "No project",
            task.assignee_name ? `Assigned: ${task.assignee_name}` : "Unassigned",
            task.due_date ? `Due ${task.due_date}` : null,
          ]
            .filter(Boolean)
            .join(" · ")
        }
      />
      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Project Manager"
        brandIcon={FolderKanban}
        items={navItems}
        groups={[actionsGroup]}
      />
      <div className="flex-1 p-4 md:p-6">{children}</div>

       <Dialog
         open={subtaskOpen}
         onOpenChange={(open) => !open && setSubtaskOpen(false)}
       >
         <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
           <DialogHeader>
             <DialogTitle>Add subtask</DialogTitle>
             <DialogDescription>
               A subtask belongs to “{task.title}”.
             </DialogDescription>
           </DialogHeader>
           <TaskForm
             workspaceDomain={workspaceDomain}
             task={undefined}
             projects={projects}
             members={members}
             defaultProject={task.project ?? undefined}
             defaultParent={task.nanoid}
             defaultParentName={task.title}
             defaultParentTaskId={task.task_id}
             parentCreatedAt={task.created_at}
             submitLabel="Add subtask"
             onSuccess={() => setSubtaskOpen(false)}
           />
         </DialogContent>
       </Dialog>

       <Sheet open={noteSheetOpen} onOpenChange={setNoteSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[720px] lg:w-[960px] p-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Attach a Note</SheetTitle>
            <SheetDescription>
              Create a note attached to this task.
            </SheetDescription>
          </SheetHeader>
          <form ref={formRef} action={noteAction} className="space-y-4 p-4">
            <input type="hidden" name="workspace_domain" value={workspaceDomain} />
            <input type="hidden" name="object_nanoid" value={task.nanoid} />
            <input type="hidden" name="relatable_key" value="task" />
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
                    {noteTypes.map((t: any) => (
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

      <Sheet open={notesSheetOpen} onOpenChange={setNotesSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[720px] lg:w-[960px] p-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Attached Notes</SheetTitle>
            <SheetDescription>
              Notes linked to this task.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 p-4">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes attached yet.</p>
            ) : (
              <ul className="space-y-2">
                {notes.map((note: any) => (
                  <li key={note.nanoid}>
                    <Link
                      href={`/${workspaceDomain}/dashboard/notebook/${note.nanoid}`}
                      className="block rounded-md border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      {note.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Button type="button" variant="outline" onClick={() => { setNotesSheetOpen(false); setNoteSheetOpen(true); }}>
              Attach a Note
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update the details of this task.</DialogDescription>
          </DialogHeader>
          <TaskForm
            workspaceDomain={workspaceDomain}
            task={task}
            projects={projects}
            members={members}
            submitLabel="Save changes"
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this task?"
        description="This task will be deleted. This cannot be undone."
        confirmLabel="Delete task"
        variant="destructive"
        onConfirm={async () => {
          const result = await deleteTaskAction({
            workspaceDomain,
            nanoid: task.nanoid,
          });
          if (result.status === "error") {
            setError(result.message ?? "The task could not be deleted.");
          } else {
            if (task.project) {
              router.push(`/${workspaceDomain}/dashboard/projects/${task.project}?tab=tasks`);
            } else {
              router.push(`/${workspaceDomain}/dashboard/projects`);
            }
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
