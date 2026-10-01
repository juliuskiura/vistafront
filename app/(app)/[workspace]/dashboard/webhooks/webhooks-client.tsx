"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, Info, Plus } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WebhookConfig } from "@/lib/api/types";

import { WebhookForm, type Platform } from "./webhook-form";

/**
 * The Webhooks screen: every registration, editable, plus the ones that inherit
 * everything from their platform.
 */
export function WebhooksClient({
  webhooks,
  platformCount,
  platforms,
  workspace,
}: {
  webhooks: WebhookConfig[];
  platformCount: number;
  platforms: Platform[];
  workspace: string;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const withRows = new Set(webhooks.map((w) => w.platform_slug));
  const inherited = platforms.filter(
    (p) => ["facebook", "instagram", "instagramfb"].includes(p.slug) && !withRows.has(p.slug),
  );

  return (
    <div className="space-y-6">
      {platformCount === 0 && (
        <Card className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-900">
            No platforms configured
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Configure a platform first — that is what a webhook inherits from when
            a field is blank.
          </p>
        </Card>
      )}

      <Card className="rounded-3xl border p-5">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {webhooks.length} registration{webhooks.length === 1 ? "" : "s"}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Check each callback URL against the App ID beside it — a URL saved
              on the wrong App reads &quot;verified&quot; and delivers nothing.
            </p>
          </div>
          {!creating && (
            <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
              <Plus className="size-3.5" />
              Add webhook
            </Button>
          )}
        </header>

        <div className="space-y-3">
          {creating && platforms.length > 0 && (
            <WebhookForm
              webhook={null}
              platforms={platforms}
              workspace={workspace}
              onClose={() => setCreating(false)}
            />
          )}

          {webhooks.map((w) => (
            <div key={w.nanoid ?? w.id}>
              {editing === (w.nanoid ?? String(w.id)) ? (
                <WebhookForm
                  webhook={w}
                  platforms={platforms}
                  workspace={workspace}
                  onClose={() => setEditing(null)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setEditing(w.nanoid ?? String(w.id))
                  }
                  className="flex w-full items-start justify-between gap-2 rounded-2xl border border-slate-200 p-4 text-left"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">{w.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {w.platform_name}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {w.is_inherited && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        inherited
                      </span>
                    )}
                    {!w.is_active && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        <AlertTriangle className="size-3" />
                        inactive
                      </span>
                    )}
                    <ChevronDown className="size-4 text-slate-400" />
                  </span>
                </button>
              )}
            </div>
          ))}

          {webhooks.length === 0 && !creating && (
            <p className="rounded-2xl border border-slate-200 p-4 text-xs text-slate-600">
              Nothing configured. Every field can be left blank to inherit from
              the platform, so a row is only needed when a platform runs more
              than one App.
            </p>
          )}
        </div>
      </Card>

      {inherited.length > 0 && (
        <Card className="rounded-3xl border p-5">
          <h2 className="mb-2 text-sm font-bold text-slate-900">
            Inherited from the platform
          </h2>
          <ul className="divide-y divide-slate-100">
            {inherited.map((p) => (
              <li
                key={p.slug}
                className="flex flex-wrap items-baseline gap-x-3 py-2 text-xs"
              >
                <span className="font-semibold text-slate-800">{p.name}</span>
                <span className="font-mono text-slate-400">{p.slug}</span>
                {!p.webhook_endpoint && (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <Info className="size-3" />
                    no callback URL resolved
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}