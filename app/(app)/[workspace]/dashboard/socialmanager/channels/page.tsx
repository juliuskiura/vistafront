import { requireWorkspace } from "@/lib/auth/server";
import { getSubscriptionStateCached, requireFeature } from "@/lib/features/guard";
import { listAccounts, verifyPage } from "@/lib/api";
import type { SocialAccount } from "@/lib/api/types";
import { ChannelsClient } from "./channels-client";
import type { VerifyVerdict } from "./_components/channel-health-label";

/**
 * How many active channels we ask Meta about on one page render. Each check is
 * one outbound Graph call (`GET /{page_id}?fields=id` with the token publishing
 * would use), so an unbounded list would make opening this screen slower than
 * the work it reports on. Past the cap a card reads "Not checked" rather than
 * claiming a health nobody measured.
 */
const VERIFY_BUDGET = 12;

export default async function ChannelsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "socialmanager.posts");
  const ws = active.domain;

  // The Messenger setup link is for the operator, not for tenants. Hiding it
  // here rather than letting the target page redirect is deliberate: a button
  // that is visible to everyone and bounces everyone but one workspace back
  // to this same screen is worse than no button, because it advertises a screen
  // the reader cannot have. `exempt` is set by the backend from
  // `_is_admin_workspace`, the same predicate the Messenger page itself guards
  // on, so the two cannot disagree. Cached, so this reuses the fetch
  // `requireFeature` already made.
  const { exempt: isConsole } = await getSubscriptionStateCached(active.nanoid);

  // No platform list here: ConnectAccountProvider owns that fetch and only runs
  // it when the shared connect modal is actually opened.
  const accounts = await listAccounts(ws).catch((): SocialAccount[] => []);

  const channels = accounts.flatMap((account) => account.managed_pages ?? []);

  const pageToAccountNanoid = channels.reduce<Record<string, string>>((map, page) => {
    const account = accounts.find((a) => a.managed_pages?.some((p) => p.nanoid === page.nanoid));
    if (account) map[page.nanoid] = account.nanoid;
    return map;
  }, {});

  // A card that only reads its own row cannot tell a working token from a
  // missing one: `token_expires_at` is null for every healthy Facebook page
  // token, so the old code rendered "Active" for channels that had no token at
  // all. Ask Meta instead, before first paint, so the first frame is truthful.
  // A disconnected channel needs no check — nothing will be published to it.
  const toVerify = channels
    .filter((page) => page.is_active)
    .slice(0, VERIFY_BUDGET)
    .map((page) => page.nanoid);

  const settled = await Promise.allSettled(
    toVerify.map((nanoid) => verifyPage(nanoid, ws)),
  );

  const verdicts: Record<string, VerifyVerdict> = {};
  settled.forEach((result, index) => {
    // A rejected check is still an answer: the platform could not confirm the
    // channel, which is exactly what the card needs to say.
    verdicts[toVerify[index]] =
      result.status === "fulfilled"
        ? result.value
        : { ok: false, error: result.reason?.message ?? "Check failed" };
  });

  return (
    <ChannelsClient
      channels={channels}
      workspaceDomain={ws}
      pageToAccountNanoid={pageToAccountNanoid}
      verdicts={verdicts}
      accounts={accounts}
      isConsoleWorkspace={isConsole}
    />
  );
}
