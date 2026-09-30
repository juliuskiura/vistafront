"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Info, Search } from "@/lib/icons";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SocialMediaPlatform, WebhookConfig } from "@/lib/api/types";

import { WebhookCard } from "./_components/webhook-card";

/**
 * A platform whose receiver exists, flattened for the "not configured
 * explicitly" panel. Declared here rather than passed as whole platform rows
 * because the client component needs four fields and nothing else.
 */
export type PlatformReceiver = Pick<
  SocialMediaPlatform,
  "slug" | "name" | "client_id" | "webhook_endpoint" | "webhook_fields"
> & { resolved_webhook_endpoint: string };

interface Props {
  webhooks: WebhookConfig[];
  /** How many platform rows came back, to tell "no platforms" from "none configured". */
  platformCount: number;
  platformsWithReceiver: PlatformReceiver[];
}

/**
 * The Webhooks screen.
 *
 * Two jobs, in this order, because they are asked in this order:
 *
 * 1. **Show the registrations.** One card per webhook row, each field carrying
 *    the `help_text` the backend ships with it. That prose is written once on
 *    the model and read from there, so the sentence an operator reads here is
 *    the same one a developer reads in the Django admin — and it cannot drift
 *    from the field's real behaviour.
 *
 * 2. **Say what is *not* configured.** A deployment running one Meta App per
 *    platform needs no webhook rows at all — every field inherits — so the
 *    common case is an empty list. Showing only the empty list would read as
 *    "nothing is configured" when the truth is "everything is inherited from
 *    the platform rows". Those platforms are listed explicitly for that reason.
 *
 * No state beyond the filter. Nothing on this screen mutates, and nothing
 * changes while it is open.
 */
export function WebhooksClient({
  webhooks,
  platformCount,
  platformsWithReceiver,
}: Props) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return webhooks;
    return webhooks.filter((w) =>
      [w.name, w.platform_name, w.platform_slug, w.resolved_client_id, w.secret_env_var ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [webhooks, query]);

  // A platform with a receiver but no row of its own. Sorted so the list is
  // stable between renders rather than following whatever order the API
  // happened to return.
  const inherited = useMemo(() => {
    const configured = new Set(webhooks.map((w) => w.platform_slug));
    return platformsWithReceiver
      .filter((p) => !configured.has(p.slug))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [platformsWithReceiver, webhooks]);

  return (
    <div className="space-y-6">
      {platformCount === 0 && (
        <Card className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                No platforms configured
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                There is nothing to point a webhook at. Configure a platform
                first — its App ID and callback URL are what a webhook row
                inherits when it leaves a field blank.
              </p>
            </div>
          </div>
        </Card>
      )}

      {webhooks.length > 0 && (
        <Card className="rounded-3xl border p-5">
          <header className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Configured registrations
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {webhooks.length} webhook{webhooks.length === 1 ? "" : "s"} across{" "}
              {new Set(webhooks.map((w) => w.platform_slug)).size} platform
              {new Set(webhooks.map((w) => w.platform_slug)).size === 1 ? "" : "s"}.
              Check each Callback URL against the App ID on the same card — a URL
              saved on the wrong App reads &quot;verified&quot; and delivers nothing.
            </p>
          </header>

          {webhooks.length > 6 && (
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by name, platform, App ID, or secret key…"
                aria-label="Filter webhooks"
                className="pl-9"
              />
            </div>
          )}

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-4 text-xs text-slate-600">
              Nothing matches that filter. {webhooks.length} webhook
              {webhooks.length === 1 ? " is" : "s are"} configured in total.
            </p>
          ) : (
            <div className="space-y-4">
              {visible.map((webhook) => (
                <WebhookCard key={webhook.nanoid ?? webhook.id} webhook={webhook} />
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="rounded-3xl border p-5">
        <header className="mb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Inherited from the platform
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            No webhook row of its own, so every field falls back to the platform
            row. Listed because an empty screen above would otherwise read as
            &quot;nothing is configured&quot; when the truth is
            &quot;everything is inherited&quot;.
          </p>
        </header>
        {inherited.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 p-4 text-xs text-slate-600">
            Every platform with a webhook receiver has a row of its own above.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {inherited.map((p) => (
              <li key={p.slug} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5">
                <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                <span className="font-mono text-[11px] text-slate-400">{p.slug}</span>
                {p.client_id && (
                  <span className="font-mono text-[11px] text-slate-500">
                    App {p.client_id}
                  </span>
                )}
                {p.webhook_endpoint || p.resolved_webhook_endpoint ? null : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700">
                    <Info className="size-3" />
                    no callback URL resolved
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
