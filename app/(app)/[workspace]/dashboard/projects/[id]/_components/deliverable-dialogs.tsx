"use client";

import type { Project } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MergeDialog } from "../../_components/merge-dialog";
import { DeliverableForm } from "../../forms/deliverable-form";
import { TaskForm } from "../../forms/task-form";
import type { PickerOption } from "../../forms/project-form";
import {
  deleteDeliverableAction,
  deleteDeliverablesAction,
} from "../../actions/deliverable-actions";
import type { DeliverableRow } from "../../record-types";

interface Props {
  project: Project;
  workspaceDomain: string;
  members: PickerOption[];
  projectOptions: PickerOption[];
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
  editTarget: DeliverableRow | null;
  onEditTargetChange: (row: DeliverableRow | null) => void;
  taskTarget: DeliverableRow | null;
  onTaskTargetChange: (row: DeliverableRow | null) => void;
  deleteTarget: DeliverableRow | null;
  onDeleteTargetChange: (row: DeliverableRow | null) => void;
  bulkDeleteOpen: boolean;
  onBulkDeleteOpenChange: (open: boolean) => void;
  mergeOpen: boolean;
  onMergeOpenChange: (open: boolean) => void;
  /** The deliverables currently ticked, for the merge and bulk-delete lists. */
  selectedRows: DeliverableRow[];
  onError: (message: string | null) => void;
  onCleared: () => void;
}

/**
 * The deliverables tab's dialogs.
 *
 * Every destructive step goes through a `ConfirmDialog` that lists the
 * records it is about to remove.
 */
export function DeliverableDialogs({
  project,
  workspaceDomain,
  members,
  projectOptions,
  addOpen,
  onAddOpenChange,
  editTarget,
  onEditTargetChange,
  taskTarget,
  onTaskTargetChange,
  deleteTarget,
  onDeleteTargetChange,
  bulkDeleteOpen,
  onBulkDeleteOpenChange,
  mergeOpen,
  onMergeOpenChange,
  selectedRows,
  onError,
  onCleared,
}: Props) {
  return (
    <>
      <Dialog open={addOpen} onOpenChange={onAddOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add deliverable</DialogTitle>
            <DialogDescription>
              A deliverable is one output of this project — a post, a
              campaign, a landing page.
            </DialogDescription>
          </DialogHeader>
          <DeliverableForm
            workspaceDomain={workspaceDomain}
            projectNanoid={project.nanoid}
            members={members}
            submitLabel="Add deliverable"
            onSuccess={() => onAddOpenChange(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && onEditTargetChange(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit deliverable</DialogTitle>
            <DialogDescription>
              Update the details of this deliverable.
            </DialogDescription>
          </DialogHeader>
          {editTarget?.detail ? (
            <DeliverableForm
              workspaceDomain={workspaceDomain}
              projectNanoid={project.nanoid}
              deliverable={editTarget.detail}
              members={members}
              submitLabel="Save changes"
              onSuccess={() => onEditTargetChange(null)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              This deliverable could not be loaded, so it cannot be edited
              here. Open it from its own page instead.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={taskTarget !== null}
        onOpenChange={(open) => !open && onTaskTargetChange(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add task</DialogTitle>
            <DialogDescription>
              A task on “{taskTarget?.summary.title}”.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            workspaceDomain={workspaceDomain}
            projects={projectOptions}
            members={members}
            defaultProject={taskTarget?.summary.nanoid}
            submitLabel="Add task"
            onSuccess={() => onTaskTargetChange(null)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && onDeleteTargetChange(null)}
        title="Delete this deliverable?"
        description={
          <div className="space-y-1">
            <p>“{deleteTarget?.summary.title}” will be deleted.</p>
            <p className="text-xs text-muted-foreground">
              The tasks that belong to it are deleted with it.
            </p>
          </div>
        }
        confirmLabel="Delete deliverable"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          const result = await deleteDeliverableAction({
            workspaceDomain,
            nanoid: deleteTarget.summary.nanoid,
          });
          if (result.status === "error") {
            onError(
              result.message ?? "The deliverable could not be deleted.",
            );
          }
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={onBulkDeleteOpenChange}
        title={`Delete ${selectedRows.length} deliverable${selectedRows.length === 1 ? "" : "s"}?`}
        description={
          <div className="space-y-2">
            <p>
              The selected deliverables and their tasks will be deleted. This
              cannot be undone.
            </p>
            <ul className="space-y-1 rounded-md bg-muted/40 p-2">
              {selectedRows.map((row) => (
                <li key={row.summary.nanoid} className="truncate text-xs">
                  • {row.summary.title}
                </li>
              ))}
            </ul>
          </div>
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          const result = await deleteDeliverablesAction({
            workspaceDomain,
            nanoids: selectedRows.map((row) => row.summary.nanoid),
          });
          if (result.status === "error") {
            onError(
              result.message ?? "The deliverables could not be deleted.",
            );
          } else {
            onCleared();
          }
        }}
      />

      <MergeDialog
        open={mergeOpen}
        onOpenChange={onMergeOpenChange}
        kind="deliverable"
        workspaceDomain={workspaceDomain}
        selected={selectedRows.map((row) => ({
          nanoid: row.summary.nanoid,
          title: row.summary.title,
        }))}
        onMerged={onCleared}
      />
    </>
  );
}
