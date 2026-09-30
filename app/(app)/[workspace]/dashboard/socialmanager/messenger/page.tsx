import { redirect } from "next/navigation";

import { Banner } from "@/components/banner";
import { getMessengerHealth, listAccounts, listPlatforms } from "@/lib/api";
import type {
  ManagedChannel,
  MessengerHealth,
  SocialAccount,
  SocialMediaPlatform,
} from "@/lib/api/types";
import { requireWorkspace } from "@/lib/auth/server";
import { getSubscriptionStateCached } from "@/lib/features/guard";
import {
  isMessengerChannel,
  MESSENGER_SLUG,
} from "@/lib/social/messenger-diagnostics";

import { MessengerSetupClient } from "./messenger-setup-client";

/**
 * What a failed health fetch degrades to.
 *
 * Zeroed rather than null, so the panel can render its normal "no problems
 * found" state with a visible "could not load" notice on top. Returning null
 * would force every consumer to branch, and the one thing the panel must never
 * do is quietly show a healthy summary because the call it was built on
 * failed.
 */
const EMPTY_HEALTH: MessengerHealth = {
  summary: {
    total_pages: 0,
    subscribed: 0,
    failed: 0,
    never_attempted: 0,
    workspaces_affected: 0,
  },
  pages: [],
  unavailable: true,
};

/**
 * Messenger setup (Server Component) — **console workspace only.**
 *
 * Answers "why is a workspace's inbox empty?" by showing the operator the
 * callback URL, the App ID, the permission the sign-in asks for, and which
 * tenants have a Page that is registered or not.
 *
 * The guard is the console workspace, and that is a deliberate two-part lock
 * rather than a page-level flourish. The content here is deployment
 * configuration — a callback URL, a Meta App ID, a scope list — and none of it
 * is a customer-facing concept, so it must not sit behind a *subscription*
 * feature where "pays for the inbox" would read as "is entitled to see how
 * the app is wired".
 *
 * `SubscriptionState.exempt` is the right signal rather than a hardcoded
 * domain string: the backend sets it from `_is_admin_workspace(workspace)`,
 * which is the same predicate behind `permstack`'s `ConsolePermissionResolver`
 * and the `_enforce_subscription` bypass. The console domain is an
 * env-overridable Django setting, so any value hardcoded here would drift the
 * first time `DEFAULT_CONSOLE_WORKSPACE_DOMAIN` was changed. Read through
 * `getSubscriptionStateCached` — the same `React cache()`-wrapped fetch every
 * guarded page already performs — so this costs no extra request.
 *
 * This is the UI half of the lock, not the authorization half. Any workspace
 * that reaches the URL is redirected with nothing fetched for it, and the data
 * behind it is separately gated in Django by `_is_admin_workspace`; the endpoint
 * refuses a non-console workspace before it builds a queryset.
 *
 * The three data calls are all read-only, and the health call is the only one
 * that crosses tenants — which is what makes it operator-only by construction.
 */
export default async function MessengerPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const state = await getSubscriptionStateCached(active.nanoid);
  if (!state.exempt) {
    redirect(`/${ws}/dashboard/socialmanager/channels`);
  }

  // A failure here must not blank the page: the platform catalogue, the account
  // list and the cross-tenant health view are independent, so each degrades to
  // empty and the panel says which half is missing rather than showing nothing.
  const [platforms, accounts, health] = await Promise.all([
    listPlatforms({ all: true, workspace: ws }).catch(
      (): SocialMediaPlatform[] => [],
    ),
    listAccounts(ws).catch((): SocialAccount[] => []),
    getMessengerHealth(ws).catch((): MessengerHealth => EMPTY_HEALTH),
  ]);
  const messengerPlatform =
    platforms.find((p) => p.slug === MESSENGER_SLUG) ?? null;

  const pages: ManagedChannel[] = accounts
    .flatMap((account) => account.managed_pages ?? [])
    .filter(isMessengerChannel);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Messenger setup"
        description="Four locks decide whether messages reach an inbox. Three of them are set in the Meta developer console, so this page shows you exactly what to enter — and which tenants have a page that is registered or not, so a support call can be answered from here."
      />

      <div className="mt-6 flex-1">
        <MessengerSetupClient
          workspace={ws}
          platform={messengerPlatform}
          platformCount={platforms.length}
          pages={pages}
          health={health}
        />
      </div>
    </div>
  );
}
