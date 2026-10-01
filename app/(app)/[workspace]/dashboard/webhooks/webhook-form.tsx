"use client";

import { useActionState, useState, useTransition } from "react";
import { Trash2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import type { SocialMediaPlatform, WebhookConfig } from "@/lib/api/types";

import { deleteWebhookAction, saveWebhookAction } from "./actions";

export type Platform = Pick<
  SocialMediaPlatform,
  "nanoid" | "slug" | "name" | "client_id" | "webhook_endpoint" | "webhook_fields"
>;

type ActionState = {
  status: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const IDLE: ActionState = { status: "idle", message: "" };

/** The four optional fields, with their form name and inherited placeholder. */
const FIELDS = [
  { name: "client_id", label: "Meta App ID", fallback: "inherits the platform's App ID" },
  { name: "callback_url", label: "Callback URL", fallback: "inherits the platform's endpoint" },
  { name: "secret_env_var", label: "Signing secret key", fallback: "inherits the provider's secret" },
  { name: "subscribed_fields", label: "Subscribed fields", fallback: "inherits the platform's list" },
] as const;

/**
 * One registration, collapsed or expanded.
 *
 * Collapsed by default so the list stays scannable — a page with three open
 * forms is three screens of prose. Placeholders show the inherited value, so you
 * can see what clearing a field will produce before you clear it.
 */
export function WebhookForm({
  webhook,
  platforms,
  workspace,
  onClose,
}: {
  webhook: WebhookConfig | null;
  platforms: Platform[];
  workspace: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveWebhookAction, IDLE);
  const [confirm, setConfirm] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [deleted, setDeleted] = useState<string | null>(null);
  const [values, setValues] = useState({
    name: webhook?.name ?? "",
    slug: webhook?.platform_slug ?? platforms[0]?.slug ?? "",
    client_id: webhook?.client_id ?? "",
    callback_url: webhook?.callback_url ?? "",
    secret_env_var: webhook?.secret_env_var ?? "",
    subscribed_fields: webhook?.subscribed_fields ?? "",
    is_active: webhook?.is_active ?? true,
  });

  const platform = platforms.find((p) => p.slug === values.slug);
  const inherited: Record<string, string | null> = {
    client_id: platform?.client_id ?? null,
    callback_url: platform?.webhook_endpoint ?? null,
    secret_env_var: null,
    subscribed_fields: platform?.webhook_fields ?? null,
  };

  function set(key: string, next: string) {
    setValues((v) => ({ ...v, [key]: next }));
  }

  function remove() {
    if (!webhook?.nanoid) return;
    setConfirm(false);
    startDelete(async () => {
      const result = await deleteWebhookAction({
        nanoid: webhook.nanoid as string,
        workspace,
      });
      setDeleted(result.message);
    });
  }

  const errors = state.fieldErrors;

  return (
    <article className="rounded-2xl border border-slate-200 p-4">
      <form action={action} className="space-y-3">
        <input type="hidden" name="nanoid" value={webhook?.nanoid ?? ""} />
        <input type="hidden" name="workspace" value={workspace} />
        <input type="hidden" name="platform" value={platform?.nanoid ?? ""} />
        <input type="hidden" name="is_active" value={String(values.is_active)} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Name
            </span>
            <Input
              name="name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Messenger"
              className="mt-1 text-sm"
            />
            {errors?.name && (
              <span className="mt-1 block text-[11px] text-red-600">
                {errors.name[0]}
              </span>
            )}
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Platform
            </span>
            <select
              value={values.slug}
              onChange={(e) => set("slug", e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              {platforms.map((p) => (
                <option key={p.nanoid} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="mt-1.5 block text-[11px] text-slate-400">
              The receiver is routed per platform, so this cannot change later.
            </span>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.name} className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {f.label}
              </span>
              <Input
                name={f.name}
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={inherited[f.name] || f.fallback}
                className="mt-1 font-mono text-xs"
              />
              {errors?.[f.name] && (
                <span className="mt-1 block text-[11px] text-red-600">
                  {errors[f.name][0]}
                </span>
              )}
              {webhook?.help_texts[f.name] && (
                <span className="mt-1.5 block text-[11px] leading-relaxed text-slate-500">
                  {webhook.help_texts[f.name]}
                </span>
              )}
            </label>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={values.is_active}
            onChange={(e) => set("is_active", String(e.target.checked))}
            className="rounded border-slate-300"
          />
          Active
        </label>

        {state.message && (
          <p
            className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
              state.status === "error"
                ? "bg-red-50 text-red-800"
                : "bg-emerald-50 text-emerald-800"
            }`}
          >
            {state.message}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : webhook ? "Save" : "Create"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
          {webhook && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirm(true)}
              className="ml-auto text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          )}
        </div>
      </form>

      {webhook && (
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={`Delete "${webhook.name}"?`}
          description="This removes our record only. It does NOT unregister anything at Meta — the App keeps sending to that callback URL until you change it there."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={remove}
        />
      )}
      {(deleting || deleted) && (
        <p className="mt-2 text-xs text-slate-600">
          {deleting ? "Deleting…" : deleted}
        </p>
      )}
    </article>
  );
}

