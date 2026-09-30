"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Search, XCircle } from "@/lib/icons";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMediumDate } from "@/lib/dates";
import type {
  MessengerHealth,
  MessengerHealthPage,
  MessengerPageState,
} from "@/lib/api/types";

/**
 * Per-state presentation. The icon and the wording carry the state as well as
 * the colour, so it is never encoded in hue alone.
 */
const TONE: Record<
  MessengerPageState,
  { Icon: typeof Info; chip: string; label: string }
> = {
  failed: { Icon: XCircle, chip: "bg-red-50 text-red-700", label: "Failed" },
  never: { Icon: AlertTriangle, chip: "bg-amber-50 text-amber-700", label: "Never attempted" },
  subscribed: { Icon: CheckCircle2, chip: "bg-emerald-50 text-emerald-700", label: "Registered" },
};

/**
 * Why a state looks the way it does, in the words of whoever has to act on it.
 *
 * `never` and `failed` are kept apart deliberately. A page that was never
 * attempted is a page connected before subscriptions existed and simply needs
 * the backfill run; a page that failed has a reason on record, and that reason
 * is what says whether the fix is a scope, a re-auth, or a Meta-side change.
 */
const EXPLAINER: Record<MessengerPageState, string> = {
  failed:
    "The token was accepted or refused and the answer is recorded. Read the reason — it is what separates a revoked token from a scope that was never granted.",
  never:
    "No subscription attempt has ever been recorded for this page. Run subscribe_facebook_pages for its workspace.",
  subscribed:
    "Meta accepted this page the last time it was asked, which also proves its token carries pages_messaging.",
};

function RepairHint({ page }: { page: MessengerHealthPage }) {
  // The command is scoped to the tenant rather than run globally: an operator
  // working one ticket should not have to think about what else the sweep
  // touches, and the command takes the slug that identifies them.
  const command = `python manage.py subscribe_facebook_pages --workspace ${page.workspace_slug}`;

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Repair
      </p>
      <code className="mt-0.5 block break-all font-mono text-xs text-slate-700">
        {command}
      </code>
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
        The tenant can do the same from their own Channels screen. This page
        diagnoses but does not repair across tenants: every write here resolves
        inside the active workspace, so an operator would be minting another
        tenant&apos;s access token from a global surface.
      </p>
    </div>
  );
}

function HealthRow({ page }: { page: MessengerHealthPage }) {
  const { Icon, chip, label } = TONE[page.state];
  return (
    <li className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">
            {page.page_name || page.page_id_platform}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-400">
            {page.page_id_platform}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${chip}`}
        >
          <Icon className="size-3.5" />
          {label}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">
          {page.workspace_name}
        </span>{" "}
        <span className="font-mono text-[11px] text-slate-400">
          {page.workspace_slug}
        </span>
      </p>

      {page.needs_reauth && (
        <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
          <AlertTriangle className="size-3" />
          Flagged for re-authorisation
        </p>
      )}

      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        {EXPLAINER[page.state]}
      </p>

      {page.attempt ? (
        <div className="mt-2 text-xs">
          <p className="text-[11px] text-slate-400">
            Last attempt {formatMediumDate(page.attempt.created_at)}
            {page.attempt.source ? ` · via ${page.attempt.source}` : ""}
          </p>
          {page.attempt.reason && (
            <p className="mt-1 break-words rounded-lg border border-red-100 bg-red-50 px-3 py-2 font-mono text-[11px] leading-relaxed text-red-800">
              {page.attempt.reason}
            </p>
          )}
        </div>
      ) : null}

      {page.state !== "subscribed" && <RepairHint page={page} />}
    </li>
  );
}

/**
 * Tenants whose Facebook Pages are not receiving messages.
 *
 * The screen an operator opens mid-support-call, so it is built around that
 * moment: broken rows first (the backend already sorts them that way), the
 * tenant's slug and name in the same row as the reason, and the exact command
 * to repair it spelled out rather than left to recall.
 *
 * Client-side filtering rather than a query parameter because the whole result
 * set is already in memory — it is one unfiltered read of the Facebook pages,
 * bounded by how many Pages exist, not a paginated list that would hide the
 * broken tenant on page four.
 */
export function ProblemWorkspaces({ health }: { health: MessengerHealth }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return health.pages;
    return health.pages.filter((p) =>
      [p.page_name, p.page_id_platform, p.workspace_slug, p.workspace_name]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [health.pages, query]);

  const { summary } = health;

  if (health.unavailable) {
    return (
      <Card className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              Subscription health could not be loaded
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              The counts below are missing, not zero. Nothing here should be read
              as &quot;no tenant has a problem&quot; until this request succeeds.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (summary.total_pages === 0) {
    return (
      <Card className="rounded-3xl border border-slate-200 p-6">
        <p className="text-sm font-bold text-slate-900">No Facebook pages yet</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Nothing to check until a tenant connects a Facebook Page. Once one is
          connected, this panel says whether it is registered for messages.
        </p>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border p-5">
      <header className="mb-4">
        <h2 className="text-sm font-bold text-slate-900">
          5. Tenants that are not receiving messages
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          One row per connected Facebook Page, worst first. A page that fails
          here is connected and publishable and will never receive a message —
          which is what a tenant&apos;s &quot;my inbox is empty&quot; report
          actually means.
        </p>
      </header>

      <dl className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ["Pages", summary.total_pages, "text-slate-900"],
            ["Registered", summary.subscribed, "text-emerald-700"],
            ["Failed", summary.failed, "text-red-700"],
            ["Never attempted", summary.never_attempted, "text-amber-700"],
          ] as const
        ).map(([label, value, tone]) => (
          <div key={label} className="rounded-xl border border-slate-200 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </dt>
            <dd className={`mt-0.5 text-lg font-bold ${tone}`}>{value}</dd>
          </div>
        ))}
      </dl>

      {summary.workspaces_affected > 0 && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {summary.workspaces_affected} workspace
          {summary.workspaces_affected === 1 ? "" : "s"} affected. The
          workspace slug is on every row — it is what the repair command is
          scoped to.
        </p>
      )}

      {health.pages.length > 8 && (
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by tenant or page…"
            aria-label="Filter tenants by name, slug, or page id"
            className="pl-9"
          />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 p-4 text-xs text-slate-600">
          Nothing matches that filter. {summary.total_pages} page
          {summary.total_pages === 1 ? " is" : "s are"} connected in total.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((page) => (
            <HealthRow key={page.page_nanoid} page={page} />
          ))}
        </ul>
      )}
    </Card>
  );
}
