import { requireWorkspace } from "@/lib/auth/server";
import { listAccounts, listPlatforms } from "@/lib/api";
import type { SocialAccount, SocialMediaPlatform } from "@/lib/api/types";
import { ChannelsClient } from "./channels-client";

export default async function ChannelsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [accounts, platforms] = await Promise.all([
    listAccounts(ws).catch((): SocialAccount[] => []),
    listPlatforms({ all: true, workspace: ws }).catch((): SocialMediaPlatform[] => []),
  ]);

  const channels = accounts.flatMap((account) => account.managed_pages ?? []);

  const pageToAccountNanoid = channels.reduce<Record<string, string>>((map, page) => {
    const account = accounts.find((a) => a.managed_pages?.some((p) => p.nanoid === page.nanoid));
    if (account) map[page.nanoid] = account.nanoid;
    return map;
  }, {});

  return <ChannelsClient channels={channels} workspaceDomain={ws} pageToAccountNanoid={pageToAccountNanoid} platforms={platforms} />;
}
