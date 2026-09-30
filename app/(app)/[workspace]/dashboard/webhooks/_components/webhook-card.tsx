"use client";

import { AlertTriangle, Check, Copy } from "@/lib/icons";
import type { WebhookConfig } from "@/lib/api/types";

/**
 * One field: its label, its value, and the sentence describing what it is for.
 *
 * The help text is not written here. It arrives on `help_texts`, read by the
 * backend from the same Django field metadata that documents the admin — so the
 * guidance an operator reads is generated from the field it describes, and the
 * two cannot disagree.
 *
 * When there is no value, the help text is shown *alone*. That is the common
 * case: a blank field means "inherit from the platform", and the sentence
 * explaining the fallback is the only thing useful to say about it. Showing an
 * empty value box next to "leave blank to inherit" would be noise.
 */
function Field({
  label,
  value,
  help,
  copyable,
  inheritedFrom,
}: {
  label: string;
  value: string;
  help: string;
  copyable?: boolean;
  /** What a blank value resolves to, shown only when `value` is blank. */
  inheritedFrom?: string;
}) {
  const blank = !value.trim();
  const shown = blank ? (inheritedFrom ?? "") : value;

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
        {blank && <span className="ml-2 normal-case text-slate-400">inherited</span>}
      </p>

      {shown ? (
        <div className="mt-1 flex items-start gap-2">
          <code className="min-w-0 flex-1 break-all font-mono text-xs text-slate-700">
            {shown}
          </code>
          {copyable && (
            <CopyButton value={shown} label={label} />
          )}
        </div>
      ) : (
        <p className="mt-1 font-mono text-xs text-slate-400">not set</p>
      )}

      {help && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{help}</p>
      )}
    </div>
  );
}

/**
 * Copy control. A long App ID or a callback URL with a query string is exactly
 * the value an operator pastes into a dashboard field, and selecting it by hand
 * is how a trailing slash goes missing.
 */
function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={() => void navigator.clipboard?.writeText(value)}
      className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-50"
    >
      <Copy className="size-3.5" />
    </button>
  );
}

/**
 * One webhook registration.
 *
 * `resolved_*` is shown rather than the stored column, because it is what the
 * operator should actually paste, and it already accounts for inheriting from
 * the platform. The stored value is shown underneath when it differs, so a
 * reader can tell "you chose this" from "this came from the platform".
 */
export function WebhookCard({ webhook }: { webhook: WebhookConfig }) {
  const { help_texts: help } = webhook;
  const overridesClientId = Boolean(webhook.client_id);

  return (
    <article className="rounded-2xl border border-slate-200 p-4">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900">{webhook.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {webhook.platform_name}{" "}
            <span className="font-mono text-[11px] text-slate-400">
              {webhook.platform_slug}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {webhook.is_inherited && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              all inherited
            </span>
          )}
          {!webhook.is_active && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              <AlertTriangle className="size-3" />
              inactive
            </span>
          )}
        </div>
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field
          label="Meta App ID"
          value={webhook.resolved_client_id}
          help={help.client_id}
          copyable
          inheritedFrom={overridesClientId ? "" : undefined}
        />
        <Field
          label="Callback URL"
          value={webhook.resolved_callback_url}
          help={help.callback_url}
          copyable
        />
        <Field
          label="Signing secret"
          value={webhook.secret_env_var ?? ""}
          help={help.secret_env_var}
          copyable
        />
        <Field
          label="Subscribed fields"
          value={webhook.resolved_subscribed_fields.join(", ")}
          help={help.subscribed_fields}
        />
      </div>

      {webhook.resolved_subscribed_fields.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {webhook.resolved_subscribed_fields.map((field) => (
            <li
              key={field}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-600"
            >
              <Check className="size-3 text-emerald-600" />
              {field}
            </li>
          ))}
        </ul>
      )}

      {webhook.subscribed_fields === null && webhook.is_inherited && (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
          This row adds nothing of its own — it inherits the App ID, URL and
          field list from the platform. It exists as documentation of a stream
          that is served by the platform&apos;s own App.
        </p>
      )}
    </article>
  );
}
