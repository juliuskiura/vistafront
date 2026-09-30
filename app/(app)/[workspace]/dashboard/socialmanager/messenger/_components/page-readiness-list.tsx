"use client";

import { AlertTriangle, CheckCircle2, Info, RefreshCw, XCircle } from "@/lib/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConnectAccount } from "@/lib/context";
import type { ManagedChannel, ReconnectPageResult } from "@/lib/api/types";
import {
  describePageReadiness,
  MESSENGER_SLUG,
  type CheckTone,
} from "@/lib/social/messenger-diagnostics";

const TONE = {
  ok: { Icon: CheckCircle2, text: "text-emerald-700", bg: "bg-emerald-50" },
  warn: { Icon: AlertTriangle, text: "text-amber-700", bg: "bg-amber-50" },
  bad: { Icon: XCircle, text: "text-red-700", bg: "bg-red-50" },
  manual: { Icon: Info, text: "text-slate-600", bg: "bg-slate-100" },
} satisfies Record<CheckTone, { Icon: typeof Info; text: string; bg: string }>;

interface Props {
  page: ManagedChannel;
  /** The last answer from `POST /pages/{nanoid}/reconnect/`, if we asked. */
  probe: ReconnectPageResult | null;
  /** True while this page's probe is in flight. */
  pending: boolean;
  onResubscribe: () => void;
  onReauthorize: () => void;
}

function PageRow({ page, probe, pending, onResubscribe, onReauthorize }: Props) {
  const { canConnect } = useConnectAccount();
  const readiness = describePageReadiness(page, probe);
  const { Icon, text, bg } = TONE[readiness.tone];

  return (
    <li className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">
            {page.page_name || page.page_id}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-400">
            {page.page_id}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${bg} ${text}`}
        >
          <Icon className="size-3.5" />
          {readiness.label}
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        {readiness.detail}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {readiness.needsReauth ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onReauthorize}
            disabled={!canConnect}
            title={
              canConnect
                ? "Re-authorise this account in a browser"
                : "Your plan does not include social publishing"
            }
            className="inline-flex items-center gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Re-authorise account
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onResubscribe}
            disabled={pending || !page.is_active}
            title={
              page.is_active
                ? "Re-mint this page token, verify it, and re-register the page for messages"
                : "Reconnect the page first"
            }
            className="inline-flex items-center gap-1.5"
          >
            <RefreshCw
              className={`size-3.5 ${pending ? "animate-spin" : ""}`}
            />
            {pending ? "Asking Meta…" : "Re-subscribe"}
          </Button>
        )}
        <span className="text-[11px] text-slate-400">
          {readiness.needsReauth
            ? "Only a browser re-authorisation can issue a new token."
            : "Also refreshes this page's access token."}
        </span>
      </div>
    </li>
  );
}

/**
 * Lock 3, per page: is this page on the app's register?
 *
 * Deliberately not prefetched on the server, unlike the Channels screen's
 * health verdicts. Probing means a live Graph call *and* a token mint per page,
 * so doing it for every page on every render of a screen people open while
 * debugging would cost an outbound request to answer a question they had not
 * asked yet. It runs when asked, and the answer is kept until the next visit.
 */
export function PageReadinessList({
  pages,
  probes,
  pendingId,
  onResubscribe,
  onReauthorize,
}: {
  pages: ManagedChannel[];
  probes: Record<string, ReconnectPageResult | null>;
  pendingId: string | null;
  onResubscribe: (nanoid: string) => void;
  onReauthorize: () => void;
}) {
  if (pages.length === 0) {
    return (
      <Card className="rounded-3xl border border-slate-200 p-6">
        <p className="text-sm font-bold text-slate-900">
          No Facebook pages on this workspace
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          This section probes the pages the <em>current</em> workspace owns, so
          a tenant&apos;s pages are repaired from their own Channels screen and
          the operator repairs every tenant at once from the panel below. The
          console workspace itself normally connects nothing, which is why this
          is usually empty here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border p-5">
      <header className="mb-4">
        <h2 className="text-sm font-bold text-slate-900">
          4. Page registration
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Each page must be registered with the Meta App before it receives
          anything. This is done automatically the moment a page is connected —
          but only then, so a page connected before that existed is connected,
          publishable, and permanently message-less with nothing recording it.
          Re-subscribe asks Meta directly and reports what it said.
        </p>
      </header>
      <ul className="space-y-3">
        {pages.map((page) => (
          <PageRow
            key={page.nanoid}
            page={page}
            probe={probes[page.nanoid] ?? null}
            pending={pendingId === page.nanoid}
            onResubscribe={() => onResubscribe(page.nanoid)}
            onReauthorize={onReauthorize}
          />
        ))}
      </ul>
      <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
        Registering a page uses the &quot;{MESSENGER_SLUG}&quot; Meta App, the same
        App shown above. A page registered against any other App is invisible to
        us.
      </p>
    </Card>
  );
}
