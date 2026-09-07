"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Heart, RefreshCw, Archive } from "lucide-react";
import type { Asset } from "@/lib/api";
import {
  deleteAssetAction,
  trashAssetAction,
  restoreAssetAction,
  favoriteAssetAction,
  bulkDeleteAssetsAction,
  bulkFavoriteAssetsAction,
  bulkRestoreAssetsAction,
  bulkPurgeAssetsAction,
} from "@/app/(app)/[workspace]/dashboard/media/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/context";
import { useTransition, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Props {
  selectedAssets: Asset[];
  workspaceDomain: string;
  onClear: () => void;
  mode: "browser" | "trash" | "recent";
}

export function AssetSelectionToolbar({
  selectedAssets,
  workspaceDomain,
  onClear,
  mode,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
  const count = selectedAssets.length;
  const nanoids = selectedAssets.map((a) => a.nanoid);

  if (count === 0) return null;

  function refresh() {
    onClear();
    router.refresh();
  }

  function handleBulkDelete() {
    if (count === 0) return;
    startTransition(async () => {
      try {
        const { deleted, failed } = await bulkDeleteAssetsAction(
          nanoids,
          workspaceDomain,
        );
        toast.push({
          variant: failed === 0 ? "success" : "error",
          message:
            failed === 0
              ? `Deleted ${deleted} asset${deleted !== 1 ? "s" : ""}.`
              : `Deleted ${deleted}; ${failed} failed.`,
        });
        refresh();
      } catch {
        toast.push({
          variant: "error",
          message: "Bulk delete failed.",
        });
      }
    });
  }

  function handleBulkFavorite() {
    if (count === 0) return;
    startTransition(async () => {
      try {
        const { updated } = await bulkFavoriteAssetsAction(
          nanoids,
          true,
          workspaceDomain,
        );
        toast.push({
          variant: "success",
          message: `Favorited ${updated} asset${updated !== 1 ? "s" : ""}.`,
        });
        refresh();
      } catch {
        toast.push({
          variant: "error",
          message: "Bulk favorite failed.",
        });
      }
    });
  }

  function handleBulkTrash() {
    if (count === 0) return;
    startTransition(async () => {
      try {
        const results = await Promise.allSettled(
          nanoids.map((nid) => trashAssetAction(nid, workspaceDomain)),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        toast.push({
          variant: failed === 0 ? "success" : "error",
          message:
            failed === 0
              ? `Moved ${count} asset${count !== 1 ? "s" : ""} to trash.`
              : `Moved ${count - failed}; ${failed} failed.`,
        });
        refresh();
      } catch {
        toast.push({
          variant: "error",
          message: "Bulk trash failed.",
        });
      }
    });
  }

  function handleBulkRestore() {
    if (count === 0) return;
    startTransition(async () => {
      try {
        const { restored, failed } = await bulkRestoreAssetsAction(
          nanoids,
          workspaceDomain,
        );
        toast.push({
          variant: failed === 0 ? "success" : "error",
          message:
            failed === 0
              ? `Restored ${restored} asset${restored !== 1 ? "s" : ""}.`
              : `Restored ${restored}; ${failed} failed.`,
        });
        refresh();
      } catch {
        toast.push({
          variant: "error",
          message: "Bulk restore failed.",
        });
      }
    });
  }

  function handleBulkPurge() {
    if (count === 0) return;
    setPurgeDialogOpen(true);
  }

  function confirmPurge() {
    startTransition(async () => {
      try {
        const { deleted, failed } = await bulkPurgeAssetsAction(
          nanoids,
          workspaceDomain,
        );
        toast.push({
          variant: failed === 0 ? "success" : "error",
          message:
            failed === 0
              ? `Permanently deleted ${deleted} asset${deleted !== 1 ? "s" : ""}.`
              : `Deleted ${deleted}; ${failed} failed.`,
        });
        refresh();
      } catch {
        toast.push({
          variant: "error",
          message: "Bulk purge failed.",
        });
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">
        {count} selected
      </span>
      <div className="ml-auto flex items-center gap-2">
        {mode === "browser" || mode === "recent" ? (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={handleBulkFavorite}
            >
              <Heart className="h-4 w-4 mr-1" />
              Favorite
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={handleBulkTrash}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Trash
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </>
        ) : null}
        {mode === "trash" ? (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={handleBulkRestore}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Restore
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => setPurgeDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Purge
            </Button>
          </>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={onClear}
        >
          Clear
        </Button>
      </div>
      </div>
      <ConfirmDialog
        open={purgeDialogOpen}
        onOpenChange={setPurgeDialogOpen}
        title="Permanently delete assets?"
        description={`This will permanently delete ${count} asset${count !== 1 ? "s" : ""}. This action cannot be undone.`}
        confirmLabel="Purge"
        variant="destructive"
        onConfirm={confirmPurge}
        confirming={pending}
      />
    </>
  );
}
