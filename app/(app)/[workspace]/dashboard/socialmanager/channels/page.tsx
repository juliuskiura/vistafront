import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { listAccounts, listPlatforms, verifyPage } from "@/lib/api";
import { buildPlatformOptions } from "@/components/socialmanager/connect-account-modal/_components/platform-copy";
import type { ConnectionHealth, SocialAccount } from "@/lib/api/types";
import { ChannelsClient } from "./channels-client";

/**
 * How many active channels the page re-verifies against the platform on each
 * load. The live answer drives the card's Connected indicator, so a channel
 * whose token is dead stops showing green even if its row is active. Capped so
 * the server request stays fast on accounts with many pages.
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


  // The Instagram doors (Door 1 `instagramfb`, Door 2 `instagram`), resolved
  // here so the direct "Connect Instagram" button can offer the choice on first
  // paint instead of fetching the catalogue client-side. `all: true` keeps an
  // inactive door's row so it still renders as a "Coming soon" option.
  const platforms = await listPlatforms({ all: true, workspace: ws }).catch(() => []);
  const instagram = buildPlatformOptions(platforms).find((option) => option.id === "instagram") ?? null;
  const instagramDoors = instagram?.doors ?? [];
  const recommendedDoorId = instagram?.recommendedDoorId ?? null;

  const accounts = await listAccounts(ws).catch((): SocialAccount[] => []);

  const channels = accounts.flatMap((account) => account.managed_pages ?? []);

  const pageToAccountNanoid = channels.reduce<Record<string, string>>((map, page) => {
    const account = accounts.find((a) => a.managed_pages?.some((p) => p.nanoid === page.nanoid));
    if (account) map[page.nanoid] = account.nanoid;
    return map;
  }, {});

  // The email of the account the channel was connected as, when the platform
  // released one. Shown on the card so a workspace can see which account owns a
  // connection; empty for logins whose platform returned no address (e.g. an
  // Instagram login with no `email` grant).
  const pageToAccountEmail = channels.reduce<Record<string, string>>((map, page) => {
    const account = accounts.find((a) => a.managed_pages?.some((p) => p.nanoid === page.nanoid));
    if (account?.account_email) map[page.nanoid] = account.account_email;
    return map;
  }, {});

  // Live confirmations from `POST /pages/{nanoid}/verify/` (a `GET /{page_id}`
  // with the publishing token) of which channels can actually connect right
  // now. Only active channels are asked, within the budget above; the rest fall
  // back to the stored health the serializer attaches to every channel, so none
  // renders as an ambiguous "Unverified".
  const toVerify = channels.filter((page) => page.is_active).slice(0, VERIFY_BUDGET);
  const settled = await Promise.allSettled(
    toVerify.map((page) =>
      verifyPage(page.nanoid, ws).then((verdict) => ({ nanoid: page.nanoid, verdict })),
    ),
  );
  const liveHealths = settled.reduce<Record<string, ConnectionHealth>>((map, result) => {
    if (result.status === "fulfilled" && result.value.verdict.health) {
      map[result.value.nanoid] = result.value.verdict.health;
    }
    return map;
  }, {});

  return (
    <ChannelsClient
      channels={channels}
      workspaceDomain={ws}
      pageToAccountNanoid={pageToAccountNanoid}
      pageToAccountEmail={pageToAccountEmail}
      liveHealths={liveHealths}
      accounts={accounts}
      instagramDoors={instagramDoors}
      recommendedDoorId={recommendedDoorId}
    />
  );
}
