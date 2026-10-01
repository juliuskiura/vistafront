"use client";

import { AlertTriangle, ChevronDown } from "@/lib/icons";
import type { WebhookConfig } from "@/lib/api/types";

/**
 * The collapsed row for one registration.
 *
 * Split out of `webhook-card.tsx` so that file stays inside the 300-line limit.
 * This is the state a page with a dozen registrations is actually read in, and
 * it carries the two signals that matter at a glance: is this row inherited (so
 * its values came from somewhere else), and is it active (so it is a current
 * registration rather than a retired one).
 *
 * The whole row is one button, because "open this to edit it" is the only
 * action available here — there is no checkbox or separate arrow to miss.
 */
export function WebhookSummary({
  webhook,
  platformName,
  onOpen,
}: {
  webhook: WebhookConfig;
  platformName: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-wrap items-start justify-between gap-2 text-left"
    >
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-900">{webhook.name}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{platformName}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {webhook.is_inherited && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            all inherited
          </span>
        )}
        {webhook.is_inherited && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <AlertTriangle className="size-3" />
            adds nothing of its own
          </span>
        )}
        {!webhook.is_active && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            <AlertTriangle className="size-3" />
            inactive
          </span>
        )}
        <ChevronDown className="size-4 text-slate-400" />
      </div>
    </button>
  );
}