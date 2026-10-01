import { redirect } from "next/navigation";

import { Banner } from "@/components/banner";
import { listPlatforms, listWebhooks } from "@/lib/api";
import type { SocialMediaPlatform, WebhookConfig } from "@/lib/api/types";
import { requireWorkspace } from "@/lib/auth/server";
import { getSubscriptionStateCached } from "@/lib/features/guard";

import { WebhooksClient } from "./webhooks-client";

/**
 * Webhooks (Server Component).
 *
 * One screen listing every inbound webhook registration: which Meta App serves
 * which platform, at what callback URL, with which fields, and which settings key
 * holds the secret that signs its deliveries.
 *
 * The page is console-workspace only, via `SubscriptionState.exempt` — which the
 * backend derives from `_is_admin_workspace(workspace)`, the same predicate
 * behind `permstack`'s `ConsolePermissionResolver`. Not a hardcoded domain,
 * because the console domain is an env-overridable Django setting that would
 * silently drift.
 *
 * That guard is the *page*. The endpoint underneath it is not separately gated:
 * `WebhookViewSet` is a plain `ModelViewSet` with no workspace scoping, exactly
 * like `SocialMediaPlatformViewSet` which holds the same App IDs and callback
 * URLs. So this redirect controls which screen is offered, and nothing more.
 *
 * Rendered on the server because nothing here changes while the screen is open.
 * No polling, no query cache, no client fetch.
 */
export default async function WebhooksPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const { exempt } = await getSubscriptionStateCached(active.nanoid);
  if (!exempt) {
    redirect(`/${ws}/dashboard/socialmanager/channels`);
  }

  const platforms = await listPlatforms({ all: true, workspace: ws }).catch(
    (): SocialMediaPlatform[] => [],
  );

  // Fetched from its own endpoint rather than read off the platform rows. The
  // nested `webhooks` field still exists and is still the cheapest read for a
  // client that already has the platforms; this endpoint is the one that can
  // write, so it is also the one the screen edits through.
  //
  // `catch` because the endpoint 404s until `0045_webhook` is applied. Degrading
  // to an empty list shows "nothing configured", which is wrong but recoverable —
  // the alternative is a server error with no page at all.
  const webhooks = await listWebhooks(ws).catch((): WebhookConfig[] => []);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Webhooks"
        description="Every inbound webhook in this deployment: which Meta App serves which platform, where it is pointed, what it subscribes to, and which settings key signs its deliveries. Each field explains itself — the traps are the same every time."
      />

      <div className="mt-6 flex-1">
        <WebhooksClient
          webhooks={webhooks}
          platformCount={platforms.length}
          workspace={ws}
          platforms={platforms.map((p) => ({
            nanoid: p.nanoid,
            slug: p.slug,
            name: p.name,
            client_id: p.client_id,
            webhook_endpoint: p.webhook_endpoint,
            webhook_fields: p.webhook_fields,
          }))}
        />
      </div>
    </div>
  );
}
