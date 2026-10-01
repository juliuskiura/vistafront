"use client";

import { useState } from "react";
import type { WebhookConfig } from "@/lib/api/types";

import { WebhookForm, type PlatformOption } from "./webhook-form";
import { WebhookSummary } from "./webhook-summary";

/**
 * One webhook registration: collapsed summary, or the edit form in place.
 *
 * Owns exactly one piece of state — whether the row is open — and delegates the
 * form itself. Editing swaps the summary for the form rather than navigating
 * away, so the operator never loses their place in a list of a dozen
 * registrations.
 *
 * Pass `webhook={null}` for the create form, which starts open because there is
 * nothing to summarise yet.
 */
export function WebhookCard({
  webhook,
  platforms,
  workspace,
}: {
  webhook: WebhookConfig | null;
  platforms: PlatformOption[];
  workspace: string;
}) {
  const isNew = webhook === null;
  const [open, setOpen] = useState(isNew);

  // `current` is resolved here rather than in the form because the collapsed
  // summary also needs the platform's display name, and both are asked for it.
  const platformName =
    webhook?.platform_name ??
    platforms.find((p) => p.slug === webhook?.platform_slug)?.name ??
    "Unknown platform";

  if (!open && webhook) {
    return (
      <article className="rounded-2xl border border-slate-200 p-4">
        <WebhookSummary
          webhook={webhook}
          platformName={platformName}
          onOpen={() => setOpen(true)}
        />
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-slate-200 p-4">
      <WebhookForm
        webhook={webhook}
        platforms={platforms}
        workspace={workspace}
        isNew={isNew}
        onCancel={() => setOpen(false)}
      />
    </article>
  );
}