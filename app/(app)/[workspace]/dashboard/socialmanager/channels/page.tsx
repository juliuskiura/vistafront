import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { listAccounts, verifyPage } from "@/lib/api";
import type { SocialAccount } from "@/lib/api/types";
import type { VerifyVerdict } from "./_components/channel-health-label";
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


  // No platform list here: ConnectAccountProvider owns that fetch and only runs
  // it when the shared connect modal is actually opened.
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
  // with the publishing token) of which channels can actually connect. Only
  // active channels are asked, within the budget above.
  const toVerify = channels.filter((page) => page.is_active).slice(0, VERIFY_BUDGET);
  const settled = await Promise.allSettled(
    toVerify.map((page) =>
      verifyPage(page.nanoid, ws).then((verdict) => ({ nanoid: page.nanoid, verdict })),
    ),
  );
  const verdicts = settled.reduce<Record<string, VerifyVerdict>>((map, result) => {
    if (result.status === "fulfilled" && typeof result.value.verdict.ok === "boolean") {
      map[result.value.nanoid] = result.value.verdict;
    }
    return map;
  }, {});

  return (
    <ChannelsClient
      channels={channels}
      workspaceDomain={ws}
      pageToAccountNanoid={pageToAccountNanoid}
      pageToAccountEmail={pageToAccountEmail}
      verdicts={verdicts}
      accounts={accounts}
    />
  );
}
