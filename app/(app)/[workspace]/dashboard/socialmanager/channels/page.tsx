import { requireWorkspace } from "@/lib/auth/server";
import { listAccounts, listPlatforms } from "@/lib/api";
import { ChannelsClient } from "./channels-client";

/**
 * Connected Channels (Server Component).
 *
 * Lists every social account and its managed pages/channels.
 * The connect modal, sync, and revoke flows are client-side interactive.
 */
export default async function ChannelsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [accounts, platforms] = await Promise.all([
    listAccounts(ws).catch(() => []),
    listPlatforms({ all: true, workspace: ws }).catch(() => []),
  ]);

  return <ChannelsClient accounts={accounts} platforms={platforms} workspaceDomain={ws} />;
}
