"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { IDLE } from "../action-state";
import { createDomainConfigAction } from "../admin-actions";
import { FieldErrors } from "./field-errors";

const FIELD =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15";

/** Register a sending domain: SES identity + the S3 bucket holding raw mail. */
export function DomainConfigForm({ workspace }: { workspace: string }) {
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
