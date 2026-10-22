"use client";

import { useState, useTransition } from "react";

import { useToast } from "@/lib/context";
import {
  bulkArchiveCompaniesAction,
  bulkDeleteCompaniesAction,
} from "@/app/(app)/[workspace]/dashboard/companies/actions";

interface Options {
  /** The nanoids of the rows the user selected. */
  selectedNanoids: string[];
  workspaceNanoid: string;
  /** Called once a run finishes — the table clears the selection. */
  onSettled: () => void;
}

/**
 * The bulk actions of the companies table: archive and delete.
 *
 * The hook owns the dialog state and the mutations, so the table only has to
 * wire two buttons to it.
 */
export function useBulkCompanyActions({
  selectedNanoids,
  workspaceNanoid,
  onSettled,
}: Options) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"archive" | "delete" | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const confirmDelete = () => {
    setPendingAction("delete");
    startTransition(async () => {
      try {
        const result = await bulkDeleteCompaniesAction({
          nanoids: selectedNanoids,
          workspace: workspaceNanoid,
        });
        const blocked = result.blocked?.length ?? 0;
        toast.push({
          variant: blocked === 0 ? "success" : "error",
          message:
            blocked === 0
              ? `Deleted ${result.affected} compan${result.affected === 1 ? "y" : "ies"}.`
              : `Deleted ${result.affected}; ${blocked} could not be deleted.`,
        });
        onSettled();
        setDeleteOpen(false);
      } catch (error) {
        console.error("bulk delete failed:", error);
        toast.push({
          variant: "error",
          message: "Could not delete the selection. Nothing was changed.",
        });
      } finally {
        setPendingAction(null);
      }
    });
  };

  const confirmArchive = () => {
    setPendingAction("archive");
    startTransition(async () => {
      try {
        const result = await bulkArchiveCompaniesAction({
          nanoids: selectedNanoids,
          workspace: workspaceNanoid,
        });
        const related = Object.values(result.related ?? {}).reduce(
          (sum, count) => sum + Number(count ?? 0),
          0,
        );
        toast.push({
          variant: "success",
          message: related
            ? `Archived ${result.affected} compan${result.affected === 1 ? "y" : "ies"} and ${related} related record${related === 1 ? "" : "s"}.`
            : `Archived ${result.affected} compan${result.affected === 1 ? "y" : "ies"}.`,
        });
        onSettled();
        setArchiveOpen(false);
      } catch (error) {
        console.error("bulk archive failed:", error);
        toast.push({
          variant: "error",
          message: "Could not archive the selection. Nothing was changed.",
        });
      } finally {
        setPendingAction(null);
      }
    });
  };

  return {
    pending,
    pendingAction,
    deleteOpen,
    archiveOpen,
    openDelete: () => setDeleteOpen(true),
    openArchive: () => setArchiveOpen(true),
    closeDelete: () => setDeleteOpen(false),
    closeArchive: () => setArchiveOpen(false),
    confirmDelete,
    confirmArchive,
  };
}
