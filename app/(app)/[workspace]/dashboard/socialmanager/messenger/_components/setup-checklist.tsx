"use client";

import { AlertTriangle, CheckCircle2, Info, XCircle } from "@/lib/icons";
import { Card } from "@/components/ui/card";
import {
  checkMessagingScope,
  checkWebhookEndpoint,
  checkWebhookFields,
  type CheckTone,
  type SetupCheck,
} from "@/lib/social/messenger-diagnostics";
import type { SocialMediaPlatform } from "@/lib/api/types";

import { CopyField } from "./copy-field";

/**
 * Per-tone presentation. The icon carries the same information as the border, so
 * the state is not encoded in colour alone.
 */
const TONE = {
  ok: {
    Icon: CheckCircle2,
    chip: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-200",
  },
  warn: {
    Icon: AlertTriangle,
    chip: "bg-amber-50 text-amber-700",
    border: "border-amber-200",
  },
  bad: {
    Icon: XCircle,
    chip: "bg-red-50 text-red-700",
    border: "border-red-200",
  },
  manual: {
    Icon: Info,
    chip: "bg-slate-100 text-slate-600",
    border: "border-slate-200",
  },
} satisfies Record<CheckTone, { Icon: typeof Info; chip: string; border: string }>;

function CheckRow({
  check,
  index,
  copyLabel,
}: {
  check: SetupCheck;
  index: number;
  /** When set, the value renders as a copyable one-liner instead of prose. */
  copyLabel?: string;
}) {
  const { Icon, chip, border } = TONE[check.tone];

  return (
    <li className={`rounded-2xl border ${border} p-4`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${chip}`}>
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">
            <span className="mr-2 font-mono text-xs text-slate-400">
              {index}
            </span>
            {check.label}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {check.detail}
          </p>
          {copyLabel && check.value ? (
            <CopyField label={copyLabel} value={check.value} />
          ) : check.value ? (
            <code className="mt-2 block break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
              {check.value}
            </code>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/**
 * Locks 1, 2 and 4 — the three that can be decided from data this app already
 * holds, so the panel is truthful on first paint rather than after somebody
 * presses a button.
 *
 * `tone: "manual"` is used deliberately and is not a hedge: the app-level field
 * subscription genuinely cannot be read back from Meta, and claiming otherwise
 * would be the one thing that could make a broken setup look fixed.
 */
export function SetupChecklist({
  platform,
}: {
  platform: SocialMediaPlatform | null;
}) {
  if (!platform) {
    return (
      <Card className="rounded-3xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-bold text-red-900">
              No Facebook platform is configured
            </p>
            <p className="mt-1 text-xs leading-relaxed text-red-800">
              Messenger events are only ever delivered by the Meta App that owns
              the Facebook Page, and this workspace has no such App configured. Add
              the Facebook platform in Platform configuration before expecting
              messages.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const checks: SetupCheck[] = [
    checkWebhookEndpoint(platform.webhook_endpoint),
    checkWebhookFields(platform.webhook_fields),
    checkMessagingScope(platform.scopes),
  ];

  return (
    <Card className="rounded-3xl border p-5">
      <header className="mb-4">
        <h2 className="text-sm font-bold text-slate-900">
          In the Meta developer console
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Three of the four locks on inbound messages are opened in Meta&apos;s
          dashboard, not here. Open the App whose ID matches, then work down the
          list.
        </p>
      </header>

      {platform.client_id ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs leading-relaxed text-slate-600">
            Register everything below against <strong className="text-slate-900">this</strong>{" "}
            Meta App. A callback URL saved under a different App still lets
            comments through, because Instagram and Facebook pages can be owned by
            different Apps — and only this App will deliver a message.
          </p>
          <CopyField label="Meta App ID" value={platform.client_id} />
        </div>
      ) : (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          This platform has no App ID configured, so there is no Meta App to
          register a callback URL against.
        </p>
      )}

      <ol className="space-y-3">
        {checks.map((check, index) => (
          <CheckRow
            key={check.id}
            check={check}
            index={index + 1}
            copyLabel={check.id === "endpoint" ? "Callback URL" : undefined}
          />
        ))}
      </ol>
    </Card>
  );
}
