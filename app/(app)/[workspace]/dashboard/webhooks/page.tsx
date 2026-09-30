import { redirect } from "next/navigation";

import { Banner } from "@/components/banner";
import { listPlatforms } from "@/lib/api";
import type { SocialMediaPlatform, WebhookConfig } from "@/lib/api/types";
import { requireWorkspace } from "@/lib/auth/server";
import { getSubscriptionStateCached } from "@/lib/features/guard";

import { WebhooksClient } from "./webhooks-client";

/**
 * Webhooks (Server Component) — **console workspace only.**
 *
 * One screen listing every inbound webhook registration in the deployment: which
 * Meta App serves which platform, at what callback URL, with which fields, and
 * which settings key holds the secret that signs its deliveries.
 *
 * The guard is the console workspace, read through `SubscriptionState.exempt`,
 * which the backend derives from `_is_admin_workspace(workspace)` — the same
 * predicate behind `permstack`'s `ConsolePermissionResolver` and the
 * subscription bypass. Not a hardcoded domain, because the console domain is an
 * env-overridable Django setting that would silently drift.
 *
 * This is the UI half of the lock. The nav item is also `console_admin_only`,
 * so the link is hidden from tenants — but a route is guessable by URL, so the
 * page cannot rely on the sidebar for its own security. The data behind it is
 * deployment configuration: callback URLs, App IDs and the names of the
 * settings keys that hold app secrets. None of that is a tenant concept.
 *
 * Rendered on the server because nothing here changes while the screen is
 * open — this is a read-only reference, not a live view. No polling, no query
 * cache, no client fetch.
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

  // Flattened because the screen is about webhook registrations, not platforms.
  // A platform with no row of its own inherits everything, which is recorded
  // separately below — dropping those silently would make a correctly
  // configured single-App deployment look like it had no webhooks at all.
  const webhooks: WebhookConfig[] = platforms.flatMap((p) => p.webhooks ?? []);
  const platformsWithReceiver = platforms.filter(
    (p) => p.is_active && Boolean(p.webhook_endpoint || p.slug === "instagram" || p.slug === "facebook" || p.slug === "instagramfb"),
  );

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
          platformsWithReceiver={platformsWithReceiver.map((p) => ({
            slug: p.slug,
            name: p.name,
            client_id: p.client_id ?? "",
            webhook_endpoint: p.webhook_endpoint,
            resolved_webhook_endpoint: p.webhook_endpoint,
            webhook_fields: p.webhook_fields,
          }))}
        />
      </div>
    </div>
  );
}
