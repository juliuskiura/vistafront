import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import {
  listPages,
  listCampaigns,
  listPlatforms,
  listHashtags,
  listChannelCapabilities,
  getPost,
} from "@/lib/api";
import type { ChannelCapabilities, ScheduledPost } from "@/lib/api/types";
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
  await requireFeature(active, "socialmanager.posts");
  const ws = active.domain;

  const [pages, campaigns, platforms, hashtags, capabilities] = await Promise.all([
    listPages({ workspace: ws }).catch(() => []),
    listCampaigns(ws).catch(() => []),
    listPlatforms({ all: true, workspace: ws }).catch(() => []),
    listHashtags(ws).catch(() => []),
    // One call replaces a per-channel join of content-formats + constraints +
    // media-specs, which the composer used to do from a client-side effect —
    // twice per selected channel, and again on every format change.
    listChannelCapabilities(ws)
      .then((res) => res.channels)
      .catch((): ChannelCapabilities[] => []),
  ]);

  let editPost: ScheduledPost | null = null;
  if (edit) {
    editPost = await getPost(edit, ws).catch(() => null);
  }

  // The composer's default schedule is "tomorrow", computed here rather than in
  // the client. A Server Component may call `Date.now()` during render; a
  // Client Component may not, and doing it on the client would also mean the
  // server and client clocks could disagree about what "tomorrow" is, producing
  // a hydration mismatch on the date input. This is an async Server Component,
  // so this runs once per request and never re-renders on the client — which is
  // exactly the condition the purity rule is protecting against.
  // eslint-disable-next-line react-hooks/purity
  const defaultScheduledAt = new Date(Date.now() + 86_400_000).toISOString();

  return (
    <ComposeClient
      pages={pages}
      campaigns={campaigns}
      platforms={platforms}
      hashtags={hashtags}
      capabilities={capabilities}
      workspaceDomain={ws}
      editPost={editPost}
      defaultScheduledAt={defaultScheduledAt}
    />
  );
}
