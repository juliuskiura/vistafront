import { requireWorkspace } from "@/lib/auth/server";
import { listAccounts } from "@/lib/api";
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

  const accounts = await listAccounts(ws).catch(() => []);

  const channels = accounts.flatMap((account) => account.managed_pages ?? []);

  return <ChannelsClient channels={channels} workspaceDomain={ws} />;
}
