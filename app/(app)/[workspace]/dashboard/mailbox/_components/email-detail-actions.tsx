"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MoreVertical, Send, Star, Trash2 } from "@/lib/icons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  deleteEmailAction,
  moveEmailAction,
  sendDraftNowAction,
  toggleStarAction,
} from "../actions";

interface EmailDetailActionsProps {
  nanoid: string;
  folders: { nanoid: string; name: string }[];
  currentFolder: string;
  mailbox: string;
  workspace: string;
  isDraft: boolean;
}

export function EmailDetailActions({
  nanoid,
  folders,
  currentFolder,
  mailbox,
  workspace,
  isDraft,
}: EmailDetailActionsProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const targets = folders.filter(
    (f) => f.name.toLowerCase() !== currentFolder.toLowerCase(),
  );

  return (
    <>
      <button
        type="button"
        aria-label="Message actions"
        onClick={() => setOpen((o) => !o)}
        className="rounded p-1.5 text-muted-foreground/70 hover:bg-muted hover:text-foreground/80"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-4 top-16 z-30 w-52 rounded-lg border border-border bg-card p-1 shadow-lg">
          {isDraft && (
            <Link
              href={`/${workspace}/dashboard/mailbox/${mailbox}/compose?draft=${nanoid}`}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground/80 hover:bg-muted"
            >
              <Send className="h-4 w-4" />
              Edit draft
            </Link>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await toggleStarAction(nanoid, workspace);
                setOpen(false);
                router.refresh();
              })
            }
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground/80 hover:bg-muted"
          >
            <Star className="h-4 w-4" />
            Toggle star
          </button>

          {isDraft && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(() => {
                  void sendDraftNowAction(mailbox, nanoid, workspace);
                })
              }
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground/80 hover:bg-muted"
            >
              <Send className="h-4 w-4" />
              Send now
            </button>
          )}

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
                    startTransition(async () => {
                      await moveEmailAction(nanoid, folder.nanoid, workspace);
                      setOpen(false);
                      router.refresh();
                    })
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

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this message?"
        description="This permanently removes the message and cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        confirming={pending}
        onConfirm={async () => {
          await deleteEmailAction(nanoid, workspace);
          router.refresh();
        }}
      />
    </>
  );
}
