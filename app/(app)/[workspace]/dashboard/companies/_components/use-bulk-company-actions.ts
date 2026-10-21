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
      const { deleted, failed } = await bulkDeleteCompaniesAction(
        selectedNanoids,
        workspaceNanoid,
      );
      toast.push({
        variant: failed === 0 ? "success" : "error",
        message:
          failed === 0
            ? `Deleted ${deleted} compan${deleted === 1 ? "y" : "ies"}.`
            : `Deleted ${deleted}; ${failed} failed.`,
      });
      onSettled();
      setDeleteOpen(false);
      setPendingAction(null);
    });
  };

  const confirmArchive = () => {
    setPendingAction("archive");
    startTransition(async () => {
      const { archived, failed } = await bulkArchiveCompaniesAction(
        selectedNanoids,
        workspaceNanoid,
      );
      toast.push({
        variant: failed === 0 ? "success" : "error",
        message:
          failed === 0
            ? `Archived ${archived} compan${archived === 1 ? "y" : "ies"}.`
            : `Archived ${archived}; ${failed} failed.`,
      });
      onSettled();
      setArchiveOpen(false);
      setPendingAction(null);
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
