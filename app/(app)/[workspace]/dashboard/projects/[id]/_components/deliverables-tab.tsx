"use client";

import { useState } from "react";

import type { Project, Task } from "@/lib/api";
import type { PickerOption } from "../../forms/project-form";
import type { DeliverableRow } from "../../record-types";
import { DeliverableCards } from "./deliverable-cards";
import { DeliverableDialogs } from "./deliverable-dialogs";
import { DeliverablesToolbar } from "./deliverables-toolbar";
import { DeliverableTree } from "./deliverable-tree";

interface Props {
  project: Project;
  workspaceDomain: string;
  deliverables: DeliverableRow[];
  tasks: Task[];
  members: PickerOption[];
  projectOptions: PickerOption[];
}

/**
 * The deliverables tab.
 *
 * Two views over the same set — a tree of deliverables with their tasks
 * nested, and a card grid grouped by the month each deliverable is due in
 * — plus the bulk actions (merge, delete) the old app had.
 */
export function DeliverablesTab({
  project,
  workspaceDomain,
  deliverables,
  tasks,
  members,
  projectOptions,
}: Props) {
  const [viewMode, setViewMode] = useState<"tree" | "cards">("tree");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DeliverableRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliverableRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [taskTarget, setTaskTarget] = useState<DeliverableRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function toggle(nanoid: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(nanoid)) next.delete(nanoid);
      else next.add(nanoid);
      return next;
    });
  }

  function toggleExpanded(nanoid: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(nanoid)) next.delete(nanoid);
      else next.add(nanoid);
      return next;
    });
  }

  const selectedRows = deliverables.filter((row) =>
    selected.has(row.summary.nanoid),
  );

  return (
    <div className="space-y-4">
      <DeliverablesToolbar
        total={deliverables.length}
        selectedCount={selected.size}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAdd={() => setAddOpen(true)}
        onMerge={() => setMergeOpen(true)}
        onBulkDelete={() => setBulkDeleteOpen(true)}
        onClearSelection={() => setSelected(new Set())}
      />

      {actionError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {viewMode === "tree" ? (
        <DeliverableTree
          rows={deliverables}
          tasks={tasks}
          selected={selected}
          expanded={expanded}
          onToggleSelect={toggle}
          onToggleExpand={toggleExpanded}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
          onAddTask={setTaskTarget}
          workspaceDomain={workspaceDomain}
        />
      ) : (
        <DeliverableCards
          rows={deliverables}
          tasks={tasks}
          selected={selected}
          onToggleSelect={toggle}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
          workspaceDomain={workspaceDomain}
        />
      )}

      <DeliverableDialogs
        project={project}
        workspaceDomain={workspaceDomain}
        members={members}
        projectOptions={projectOptions}
        addOpen={addOpen}
        onAddOpenChange={setAddOpen}
        editTarget={editTarget}
        onEditTargetChange={setEditTarget}
        taskTarget={taskTarget}
        onTaskTargetChange={setTaskTarget}
        deleteTarget={deleteTarget}
        onDeleteTargetChange={setDeleteTarget}
        bulkDeleteOpen={bulkDeleteOpen}
        onBulkDeleteOpenChange={setBulkDeleteOpen}
        mergeOpen={mergeOpen}
        onMergeOpenChange={setMergeOpen}
        selectedRows={selectedRows}
        onError={setActionError}
        onCleared={() => setSelected(new Set())}
      />
    </div>
  );
}
