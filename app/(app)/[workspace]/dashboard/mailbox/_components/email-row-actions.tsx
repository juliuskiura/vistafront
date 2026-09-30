"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { MoreVertical, Star, Trash2 } from "@/lib/icons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  deleteEmailAction,
  moveEmailAction,
  toggleStarAction,
} from "../actions";
import type { Folder } from "@/lib/api/mailbox";

interface EmailRowActionsProps {
  nanoid: string;
  folders: Folder[];
  currentFolder: string;
  workspace: string;
  isStarred: boolean;
}

/**
 * Per-row controls: star toggle, move-to-folder, and delete.
 *
 * Delete goes through `ConfirmDialog` — never a native `confirm()` — and every
 * action is a Server Action, so there is no client-side fetch for mutations.
 */
export function EmailRowActions({
  nanoid,
  folders,
  currentFolder,
  workspace,
  isStarred,
}: EmailRowActionsProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const targets = folders.filter(
    (f) => f.name.toLowerCase() !== currentFolder.toLowerCase(),
  );

  function run(action: () => Promise<void> | void) {
    startTransition(async () => {
      await action();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="Message actions"
          onClick={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
          }}
          className="rounded p-1 text-muted-foreground/70 hover:bg-muted hover:text-foreground/80"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {open && (
          <div className="absolute left-0 top-8 z-30 w-52 rounded-lg border border-border bg-card p-1 shadow-lg">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => toggleStarAction(nanoid, workspace))}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground/80 hover:bg-muted"
            >
              <Star className="h-4 w-4" />
              {isStarred ? "Remove star" : "Add star"}
            </button>

            {targets.length > 0 && (
              <>
                <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Move to
                </p>
                {targets.map((folder) => (
                  <button
                    key={folder.nanoid}
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(() => moveEmailAction(nanoid, folder.nanoid, workspace))
                    }
                    className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-foreground/80 hover:bg-muted"
                  >
                    {folder.name}
                  </button>
                ))}
              </>
            )}

            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setConfirming(true);
              }}
              className="mt-1 flex w-full items-center gap-2 border-t border-border px-2 py-1.5 text-left text-sm text-destructive hover:bg-red-50:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this message?"
        description="This permanently removes the message and cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        confirming={pending}
        onConfirm={() => run(() => deleteEmailAction(nanoid, workspace))}
      />
    </>
  );
}
