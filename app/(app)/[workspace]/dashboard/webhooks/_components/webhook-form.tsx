"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState, useState } from "react";
import type { SocialMediaPlatform, WebhookConfig } from "@/lib/api/types";

import { saveWebhookAction, WEBHOOK_IDLE } from "../actions";
import { WebhookDelete } from "./webhook-delete";

/** The platform fields a form needs: the picker plus the inherited defaults. */
export type PlatformOption = Pick<
  SocialMediaPlatform,
  "nanoid" | "slug" | "name" | "client_id" | "webhook_endpoint" | "webhook_fields"
>;

function FieldId(label: string) {
  return `wh-${label.replace(/\s+/g, "-").toLowerCase()}`;
}

/**
 * One editable field: label, input, error, and the model's own help text.
 *
 * The help text is not written here. It arrives on `help_texts`, read by the
 * backend from the same Django field metadata that documents the admin, so the
 * guidance an operator reads is generated from the field it describes.
 *
 * The inherited value shown as a placeholder is the important part. Clearing a
 * field is a real edit — "inherit from the platform" — so the operator can see
 * what clearing it will produce before they clear it, rather than discovering
 * afterwards that a field quietly went back to inheriting.
 */
function EditableField({
  label,
  name,
  value,
  placeholder,
  help,
  error,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  help: string;
  error?: string[];
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <label
        className="text-[11px] font-semibold uppercase tracking-wide text-slate-400"
        htmlFor={FieldId(label)}
      >
        {label}
      </label>
      <Input
        id={FieldId(label)}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 font-mono text-xs"
      />
      {error && <p className="mt-1 text-[11px] text-red-600">{error[0]}</p>}
      {help && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{help}</p>
      )}
    </div>
  );
}

/** The name + platform pair, which are not inherited fields and get their own layout. */
function IdentityFields({
  name,
  slug,
  platforms,
  help,
  errors,
  onName,
  onSlug,
}: {
  name: string;
  slug: string;
  platforms: PlatformOption[];
  help?: Record<string, string>;
  errors?: Record<string, string[]>;
  onName: (v: string) => void;
  onSlug: (v: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label
          htmlFor={FieldId("name")}
          className="text-[11px] font-semibold uppercase tracking-wide text-slate-400"
        >
          Name
        </label>
        <Input
          id={FieldId("name")}
          name="name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Messenger"
          className="mt-1 text-sm"
        />
        {errors?.name && (
          <p className="mt-1 text-[11px] text-red-600">{errors.name[0]}</p>
        )}
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          {help?.name ?? "What this stream is for, in plain words. Purely a label."}
        </p>
      </div>

      <div>
        <label
          htmlFor={FieldId("platform")}
          className="text-[11px] font-semibold uppercase tracking-wide text-slate-400"
        >
          Platform
        </label>
        <select
          id={FieldId("platform")}
          value={slug}
          onChange={(e) => onSlug(e.target.value)}
          className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
        >
          {platforms.map((p) => (
            <option key={p.nanoid} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          {help?.platform ??
            "The platform this webhook receives events for. It cannot serve another one."}
        </p>
      </div>
    </div>
  );
}

/**
 * The create/edit form for one webhook registration.
 *
 * Split out of `webhook-card.tsx` to keep both files inside the 300-line limit;
 * the card owns the collapsed/open decision, this owns the fields.
 *
 * All six values are always submitted, because blank is meaningful — an empty
 * field means "inherit from the platform". Sending only the changed ones would
 * make it impossible to go back to inheriting once a value had been set.
 */
export function WebhookForm({
  webhook,
  platforms,
  workspace,
  isNew,
  onCancel,
}: {
  webhook: WebhookConfig | null;
  platforms: PlatformOption[];
  workspace: string;
  isNew: boolean;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    saveWebhookAction,
    WEBHOOK_IDLE,
  );
  const [name, setName] = useState(webhook?.name ?? "");
  const [slug, setSlug] = useState(webhook?.platform_slug ?? platforms[0]?.slug ?? "");
  const [clientId, setClientId] = useState(webhook?.client_id ?? "");
  const [callbackUrl, setCallbackUrl] = useState(webhook?.callback_url ?? "");
  const [secretEnvVar, setSecretEnvVar] = useState(webhook?.secret_env_var ?? "");
  const [fields, setFields] = useState(webhook?.subscribed_fields ?? "");
  const [isActive, setIsActive] = useState(webhook?.is_active ?? true);

  // Submitted as a nanoid because that is what the backend serializer resolves
  // on. The select shows slugs because those are what the operator recognises.
  const current = platforms.find((p) => p.slug === slug);
  const errors = state.fieldErrors;
  const help = webhook?.help_texts;

  return (
    <>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="nanoid" value={webhook?.nanoid ?? ""} />
        <input type="hidden" name="workspace" value={workspace} />
        <input type="hidden" name="platform" value={current?.nanoid ?? ""} />
        <input type="hidden" name="is_active" value={String(isActive)} />

        <IdentityFields
          name={name}
          slug={slug}
          platforms={platforms}
          help={help}
          errors={errors}
          onName={setName}
          onSlug={setSlug}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <EditableField
            label="Meta App ID"
            name="client_id"
            value={clientId}
            placeholder={current?.client_id || "inherits the platform's App ID"}
            help={help?.client_id ?? "Leave blank to inherit. Check the callback URL against this App."}
            error={errors?.client_id}
            onChange={setClientId}
          />
          <EditableField
            label="Callback URL"
            name="callback_url"
            value={callbackUrl}
            placeholder={current?.webhook_endpoint || "inherits the platform's webhook endpoint"}
            help={help?.callback_url ?? "Leave blank to inherit the platform's endpoint."}
            error={errors?.callback_url}
            onChange={setCallbackUrl}
          />
          <EditableField
            label="Signing secret key"
            name="secret_env_var"
            value={secretEnvVar}
            placeholder="inherits the provider's secret"
            help={help?.secret_env_var ?? "The name of the settings key holding the secret — never the secret itself."}
            error={errors?.secret_env_var}
            onChange={setSecretEnvVar}
          />
          <EditableField
            label="Subscribed fields"
            name="subscribed_fields"
            value={fields}
            placeholder={current?.webhook_fields || "inherits the platform's field list"}
            help={help?.subscribed_fields ?? "Comma-separated. Display only — this is not sent to Meta."}
            error={errors?.subscribed_fields}
            onChange={setFields}
          />
        </div>

        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mt-0.5 rounded border-slate-300"
          />
          <span>
            Active — an inactive row keeps its documentation but is not offered as
            a current registration
          </span>
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

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : isNew ? "Create webhook" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>

      {!isNew && webhook?.nanoid && (
        <WebhookDelete
          nanoid={webhook.nanoid}
          name={webhook.name}
          workspace={workspace}
        />
      )}
    </>
  );
}