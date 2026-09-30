"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createDomainConfigAction,
  createMailboxAction,
  deleteDomainConfigAction,
  deleteMailboxAction,
  syncMailsAction,
  testS3ConnectionAction,
} from "../actions";
import { IDLE } from "../action-state";
import type { DomainConfig, Mailbox } from "@/lib/api/mailbox";

const FIELD =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900";

function FieldErrors({ errors }: { errors?: Record<string, string[] | undefined> }) {
  if (!errors) return null;
  const entries = Object.entries(errors).filter(
    (entry): entry is [string, string[]] => Array.isArray(entry[1]),
  );
  if (entries.length === 0) return null;
  return (
    <>
      {entries.map(([field, messages]) =>
        messages.map((msg) => (
          <p key={`${field}-${msg}`} className="mt-1 text-xs text-red-600">
            {msg}
          </p>
        )),
      )}
    </>
  );
}

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
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Mailboxes
        </h3>
        {mailboxes.length === 0 ? (
          <p className="mt-1 text-xs text-slate-500">No mailboxes yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {mailboxes.map((m) => (
              <li
                key={m.nanoid}
                className="flex flex-wrap items-center gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {m.email_address}
                  </p>
                  <p className="text-xs text-slate-500">
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
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
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
            <p className="text-xs text-red-600">{createState.message}</p>
          )}
          {createState.status === "success" && (
            <p className="text-xs text-emerald-600">{createState.message}</p>
          )}
          <div>
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? "Creating..." : "Create mailbox"}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Sending domains
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Each domain maps an SES identity to the S3 bucket that stores raw
          inbound mail.
        </p>
        {status && (
          <p
            className={`mt-2 text-xs ${status.ok ? "text-emerald-600" : "text-red-600"}`}
          >
            {status.text}
          </p>
        )}
        <ul className="mt-2 space-y-2">
          {domainConfigs.map((dc) => (
            <li
              key={dc.nanoid}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {dc.domain}
                </p>
                <p className="text-xs text-slate-500">
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

function DomainConfigForm({ workspace }: { workspace: string }) {
  const [state, action, pending] = useActionState(createDomainConfigAction, IDLE);

  return (
    <form action={action} className="mt-3 grid max-w-xl gap-3">
      <input type="hidden" name="workspace" value={workspace} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="domain" required placeholder="example.com" className={FIELD} />
        <input name="provider" required placeholder="ses" className={FIELD} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="aws_ses_region_name" required placeholder="eu-west-1" className={FIELD} />
        <input name="s3_bucket" required placeholder="my-mail-bucket" className={FIELD} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="aws_access_key_id"
          required
          placeholder="Access key ID"
          autoComplete="off"
          className={FIELD}
        />
        <input
          name="aws_secret_access_key"
          required
          type="password"
          placeholder="Secret access key"
          autoComplete="new-password"
          className={FIELD}
        />
      </div>
      <FieldErrors errors={state.fieldErrors} />
      {state.status === "error" && state.message && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="text-xs text-emerald-600">{state.message}</p>
      )}
      <div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving..." : "Add domain"}
        </Button>
      </div>
    </form>
  );
}
