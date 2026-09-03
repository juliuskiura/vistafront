import { requireWorkspace } from "@/lib/auth/server";
import {
  listPages,
  listCampaigns,
  listPlatforms,
  listAccounts,
  listHashtags,
  getPost,
} from "@/lib/api";
import type { ScheduledPost } from "@/lib/api/types";
import { ComposeClient } from "./compose-client";

export default async function ComposePage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { workspace: slug } = await params;
  const { edit } = await searchParams;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [pages, campaigns, platforms, accounts, hashtags] = await Promise.all([
    listPages({ workspace: ws }).catch(() => []),
    listCampaigns(ws).catch(() => []),
    listPlatforms({ all: true, workspace: ws }).catch(() => []),
    listAccounts(ws).catch(() => []),
    listHashtags(ws).catch(() => []),
  ]);

  let editPost: ScheduledPost | null = null;
  if (edit) {
    editPost = await getPost(edit, ws).catch(() => null);
  }

  return (
    <ComposeClient
      pages={pages}
      campaigns={campaigns}
      platforms={platforms}
      accounts={accounts}
      hashtags={hashtags}
      workspaceDomain={ws}
      editPost={editPost}
    />
  );
}
