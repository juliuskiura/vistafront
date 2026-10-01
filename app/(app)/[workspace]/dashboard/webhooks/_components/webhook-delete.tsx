"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { deleteWebhookAction } from "../actions";

/**
 * The delete affordance for one registration: a button, a confirmation, and the
 * result message.
 *
 * Its own file because the delete story has two parts worth reading together —
 * the trigger, the confirm text, and the outcome — and keeping them adjacent is
 * what stops the confirm text from drifting away from what actually happens.
 *
 * The confirm text says what deletion does *not* do. It does not unregister
 * anything at Meta: the App keeps posting to the callback URL until that is
 * changed there, and we have only stopped recording what it was pointed at.
 * Without that sentence, "deleted" reads as "this is fixed" and the deliveries
 * still never arrive.
 */
export function WebhookDelete({
  nanoid,
  name,
  workspace,
}: {
  nanoid: string;
  name: string;
  workspace: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [message, setMessage] = useState<{
    status: "success" | "error";
    text: string;
  } | null>(null);

  function runDelete() {
    setConfirmOpen(false);
    startDelete(async () => {
      const result = await deleteWebhookAction({ nanoid, workspace });
      setMessage({
        status: result.status === "error" ? "error" : "success",
        text: result.message,
      });
    });
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setConfirmOpen(true)}
        className="ml-auto text-red-600 hover:bg-red-50"
      >
        Delete
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${name}"?`}
        description="This removes our record of the registration. It does NOT unregister anything at Meta — the App keeps sending to that callback URL until you change it there. You can always add the row back."
        confirmLabel="Delete webhook"
        variant="destructive"
        onConfirm={runDelete}
      />

      {deleting && <p className="mt-2 text-xs text-slate-500">Deleting…</p>}
      {message && (
        <p
          className={`mt-2 rounded-lg px-3 py-2 text-xs leading-relaxed ${
            message.status === "error"
              ? "bg-red-50 text-red-800"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {message.text}
        </p>
      )}
    </>
  );
}