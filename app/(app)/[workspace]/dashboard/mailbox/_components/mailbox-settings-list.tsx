"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createMailboxAction,
  deleteDomainConfigAction,
  deleteMailboxAction,
  syncMailsAction,
  testS3ConnectionAction,
} from "../admin-actions";
import { IDLE } from "../action-state";
import { DomainConfigForm } from "./domain-config-form";
import { FieldErrors } from "./field-errors";
import type { DomainConfig, Mailbox } from "@/lib/api/mailbox";

const FIELD =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary";


/** Mailbox list: create, delete (with confirmation), and per-domain sync. */
export function MailboxSettingsList({
  mailboxes,
  domainConfigs,
  workspace,
}: {
  mailboxes: Mailbox[];
  domainConfigs: DomainConfig[];
  workspace: string;
}) {
  const [createState, createAction, creating] = useActionState(
    createMailboxAction,
    IDLE,
  );
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<Mailbox | null>(null);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-foreground">
          Mailboxes
        </h3>
        {mailboxes.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">No mailboxes yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border-800 border-border">
            {mailboxes.map((m) => (
              <li
                key={m.nanoid}
                className="flex flex-wrap items-center gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {m.email_address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.display_name || "No display name"} · {m.domain}
                    {m.email_template === "premium" && " · premium template"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleting(m)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground">
          Add a mailbox
        </h3>
        <form action={createAction} className="mt-2 grid max-w-xl gap-3">
          <input type="hidden" name="workspace" value={workspace} />
          <div>
            <input
              name="email_address"
              type="email"
              required
              placeholder="support@example.com"
              className={FIELD}
            />
            <FieldErrors
              errors={
                createState.fieldErrors?.email_address
                  ? { email_address: createState.fieldErrors.email_address }
                  : undefined
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="domain" required placeholder="example.com" className={FIELD} />
            <select name="email_template" className={FIELD} defaultValue="none">
              <option value="none">Standard template</option>
              <option value="premium">Premium template</option>
            </select>
          </div>
          <input name="display_name" placeholder="Display name (optional)" className={FIELD} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="password"
              type="password"
              required
              placeholder="Password"
              autoComplete="new-password"
              className={FIELD}
            />
            <input
              name="confirm_password"
              type="password"
              required
              placeholder="Confirm password"
              autoComplete="new-password"
              className={FIELD}
            />
          </div>
          <FieldErrors
            errors={
              createState.fieldErrors
                ? {
                    password: createState.fieldErrors.password,
                    confirm_password: createState.fieldErrors.confirm_password,
                  }
                : undefined
            }
          />
          {createState.status === "error" && createState.message && (
            <p className="text-xs text-destructive">{createState.message}</p>
          )}
          {createState.status === "success" && (
            <p className="text-xs text-primary">{createState.message}</p>
          )}
          <div>
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? "Creating..." : "Create mailbox"}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground">
          Sending domains
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Each domain maps an SES identity to the S3 bucket that stores raw
          inbound mail.
        </p>
        {status && (
          <p
            className={`mt-2 text-xs ${status.ok ? "text-primary" : "text-destructive"}`}
          >
            {status.text}
          </p>
        )}
        <ul className="mt-2 space-y-2">
          {domainConfigs.map((dc) => (
            <li
              key={dc.nanoid}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2.5 border-border"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {dc.domain}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dc.provider} · {dc.aws_ses_region_name} · {dc.s3_bucket} ·{" "}
                  {dc.mailbox_count} mailbox{dc.mailbox_count === 1 ? "" : "es"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await testS3ConnectionAction(dc.nanoid, workspace);
                    setStatus({ text: result.message ?? "", ok: result.status === "success" });
                  })
                }
              >
                Test S3
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await syncMailsAction(dc.nanoid, workspace);
                    setStatus({ text: result.message ?? "", ok: result.status === "success" });
                    router.refresh();
                  })
                }
              >
                Sync mail
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteDomainConfigAction(dc.nanoid, workspace);
                    router.refresh();
                  })
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <DomainConfigForm workspace={workspace} />
      </section>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.email_address ?? "this mailbox"}?`}
        description="The mailbox and every message in it will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        confirming={pending}
        onConfirm={async () => {
          if (!deleting) return;
          startTransition(async () => {
            await deleteMailboxAction(deleting.nanoid, workspace);
            router.refresh();
          });
        }}
      />
    </div>
  );
}
