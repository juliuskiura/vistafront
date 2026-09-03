import "server-only";

import { serverFetch, serverMutate, toQueryString } from "./server-fetch";
import type {
  AnalyticsSyncStatusResult,
  Campaign,
  CampaignForm,
  ConnectedInstagramResult,
  ContentConstraint,
  DiscoverChannelsResult,
  Hashtag,
  ManagedChannel,
  MediaConstraint,
  MetricSnapshot,
  OauthInitResult,
  OauthRedirectUriResult,
  PlatformContentFormat,
  PostComment,
  PostCommentType,
  PostQueue,
  PostQueueItem,
  PostsSyncStatusResult,
  RevokeAccountResult,
  ScheduledPost,
  ScheduledPostForm,
  SocialAccount,
  SocialAccountForm,
  SocialMediaPlatform,
  SyncChannelSelectionResult,
  SyncTaskResult,
} from "./types";

/**
 * Build the per-call options so the active workspace is forwarded as the
 * ``X-Workspace`` header on every socialmanager call. All socialmanager
 * endpoints are tenant-scoped, so ``workspace`` is required.
 */
function wsOpts(workspace: string) {
  return { workspace };
}

/* ──────────────────────────────────────────────────────────────────────
 * Platform Config
 * ────────────────────────────────────────────────────────────────────── */

export function listPlatforms(
  opts: { all?: boolean; workspace: string },
): Promise<SocialMediaPlatform[]> {
  const { workspace, ...rest } = opts;
  return serverFetch<SocialMediaPlatform[]>(
    `/apis/socialmanager/platforms/${toQueryString(rest)}`,
    wsOpts(workspace),
  );
}

export function createPlatform(
  body: Partial<SocialMediaPlatform>,
  workspace: string,
): Promise<SocialMediaPlatform> {
  return serverMutate<SocialMediaPlatform>("/apis/socialmanager/platforms/", {
    body,
    workspace,
  });
}

export function updatePlatform(
  nanoid: string,
  body: Partial<SocialMediaPlatform>,
  workspace: string,
): Promise<SocialMediaPlatform> {
  return serverMutate<SocialMediaPlatform>(
    `/apis/socialmanager/platforms/${nanoid}/`,
    { body, method: "PATCH", workspace },
  );
}

export function deletePlatform(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/socialmanager/platforms/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

/* ── Content formats ── */

export function listContentFormats(
  opts: { platform?: string; all?: boolean; workspace: string },
): Promise<PlatformContentFormat[]> {
  const { workspace, ...rest } = opts;
  return serverFetch<PlatformContentFormat[]>(
    `/apis/socialmanager/content-formats/${toQueryString(rest)}`,
    wsOpts(workspace),
  );
}

export function createContentFormat(
  body: Partial<PlatformContentFormat>,
  workspace: string,
): Promise<PlatformContentFormat> {
  return serverMutate<PlatformContentFormat>(
    "/apis/socialmanager/content-formats/",
    { body, workspace },
  );
}

export function updateContentFormat(
  nanoid: string,
  body: Partial<PlatformContentFormat>,
  workspace: string,
): Promise<PlatformContentFormat> {
  return serverMutate<PlatformContentFormat>(
    `/apis/socialmanager/content-formats/${nanoid}/`,
    { body, method: "PATCH", workspace },
  );
}

export function deleteContentFormat(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/socialmanager/content-formats/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

/* ── Constraints ── */

export function listConstraints(
  opts: { platform?: string; all?: boolean; workspace: string },
): Promise<ContentConstraint[]> {
  const { workspace, ...rest } = opts;
  return serverFetch<ContentConstraint[]>(
    `/apis/socialmanager/constraints/${toQueryString(rest)}`,
    wsOpts(workspace),
  );
}

export function getProviderConstraints(
  platform: string,
  workspace: string,
): Promise<ContentConstraint[]> {
  return serverFetch<ContentConstraint[]>(
    `/apis/socialmanager/constraints/?platform=${encodeURIComponent(platform)}`,
    wsOpts(workspace),
  );
}

export function createConstraint(
  body: Partial<ContentConstraint>,
  workspace: string,
): Promise<ContentConstraint> {
  return serverMutate<ContentConstraint>("/apis/socialmanager/constraints/", {
    body,
    workspace,
  });
}

export function updateConstraint(
  nanoid: string,
  body: Partial<ContentConstraint>,
  workspace: string,
): Promise<ContentConstraint> {
  return serverMutate<ContentConstraint>(
    `/apis/socialmanager/constraints/${nanoid}/`,
    { body, method: "PATCH", workspace },
  );
}

export function deleteConstraint(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/socialmanager/constraints/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

/* ── Media specs ── */

export function listMediaSpecs(
  opts: { constraint?: string; workspace: string },
): Promise<MediaConstraint[]> {
  const { workspace, ...rest } = opts;
  return serverFetch<MediaConstraint[]>(
    `/apis/socialmanager/media-specs/${toQueryString(rest)}`,
    wsOpts(workspace),
  );
}

export function createMediaSpec(
  body: Partial<MediaConstraint>,
  workspace: string,
): Promise<MediaConstraint> {
  return serverMutate<MediaConstraint>("/apis/socialmanager/media-specs/", {
    body,
    workspace,
  });
}

export function updateMediaSpec(
  nanoid: string,
  body: Partial<MediaConstraint>,
  workspace: string,
): Promise<MediaConstraint> {
  return serverMutate<MediaConstraint>(
    `/apis/socialmanager/media-specs/${nanoid}/`,
    { body, method: "PATCH", workspace },
  );
}

export function deleteMediaSpec(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/socialmanager/media-specs/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Accounts
 * ────────────────────────────────────────────────────────────────────── */

export function listAccounts(workspace: string): Promise<SocialAccount[]> {
  return serverFetch<SocialAccount[]>("/apis/socialmanager/accounts/", wsOpts(workspace));
}

export function createAccount(
  body: SocialAccountForm,
  workspace: string,
): Promise<SocialAccount> {
  return serverMutate<SocialAccount>("/apis/socialmanager/accounts/", { body, workspace });
}

export function updateAccount(
  nanoid: string,
  body: Partial<SocialAccountForm>,
  workspace: string,
): Promise<SocialAccount> {
  return serverMutate<SocialAccount>(`/apis/socialmanager/accounts/${nanoid}/`, {
    body,
    method: "PATCH",
    workspace,
  });
}

export function deleteAccount(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/socialmanager/accounts/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

export function oauthInit(
  body: { platform: string; rerequest?: boolean; method?: string },
  workspace: string,
): Promise<OauthInitResult> {
  const parts = [`platform=${encodeURIComponent(body.platform)}`];
  if (body.method) parts.push(`method=${encodeURIComponent(body.method)}`);
  if (body.rerequest) parts.push("mode=rerequest");
  return serverMutate<OauthInitResult>(
    `/apis/socialmanager/accounts/oauth_init/?${parts.join("&")}`,
    { body: {}, workspace },
  );
}

export function getOauthRedirectUri(
  platform: string,
  workspace: string,
): Promise<OauthRedirectUriResult> {
  return serverFetch<OauthRedirectUriResult>(
    `/apis/socialmanager/accounts/oauth_redirect_uri/?platform=${encodeURIComponent(platform)}`,
    wsOpts(workspace),
  );
}

export function syncAccount(nanoid: string, workspace: string): Promise<SocialAccount> {
  return serverMutate<SocialAccount>(`/apis/socialmanager/accounts/${nanoid}/sync/`, {
    body: {},
    workspace,
  });
}

export function discoverChannels(
  nanoid: string,
  workspace: string,
): Promise<DiscoverChannelsResult> {
  return serverFetch<DiscoverChannelsResult>(
    `/apis/socialmanager/accounts/${nanoid}/discover_channels/`,
    wsOpts(workspace),
  );
}

export function syncChannelSelection(
  body: { social_account: string; entity_ids: string[] },
  workspace: string,
): Promise<SyncChannelSelectionResult> {
  return serverMutate<SyncChannelSelectionResult>(
    "/apis/socialmanager/pages/sync_selection/",
    { body, workspace },
  );
}

export function revokeAccount(
  nanoid: string,
  workspace: string,
): Promise<RevokeAccountResult> {
  return serverMutate<RevokeAccountResult>(
    `/apis/socialmanager/accounts/${nanoid}/revoke/`,
    { body: {}, workspace },
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Pages (managed channels)
 * ────────────────────────────────────────────────────────────────────── */

export function listPages(
  opts: { social_account?: string; platform?: string; workspace: string },
): Promise<ManagedChannel[]> {
  const { workspace, ...rest } = opts;
  return serverFetch<ManagedChannel[]>(
    `/apis/socialmanager/pages/${toQueryString(rest)}`,
    wsOpts(workspace),
  );
}

export function verifyPage(
  nanoid: string,
  workspace: string,
): Promise<{ ok: boolean; error?: string; error_type?: string }> {
  return serverMutate<{ ok: boolean; error?: string; error_type?: string }>(
    `/apis/socialmanager/pages/${nanoid}/verify/`,
    { body: {}, workspace },
  );
}

export function getConnectedInstagram(
  nanoid: string,
  workspace: string,
): Promise<ConnectedInstagramResult> {
  return serverMutate<ConnectedInstagramResult>(
    `/apis/socialmanager/pages/${nanoid}/get_connected_instagram/`,
    { body: {}, workspace },
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Campaigns
 * ────────────────────────────────────────────────────────────────────── */

export function listCampaigns(workspace: string): Promise<Campaign[]> {
  return serverFetch<Campaign[]>("/apis/socialmanager/campaigns/", wsOpts(workspace));
}

export function createCampaign(
  body: CampaignForm,
  workspace: string,
): Promise<Campaign> {
  return serverMutate<Campaign>("/apis/socialmanager/campaigns/", { body, workspace });
}

export function updateCampaign(
  nanoid: string,
  body: Partial<CampaignForm>,
  workspace: string,
): Promise<Campaign> {
  return serverMutate<Campaign>(`/apis/socialmanager/campaigns/${nanoid}/`, {
    body,
    method: "PATCH",
    workspace,
  });
}

export function deleteCampaign(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/socialmanager/campaigns/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Posts
 * ────────────────────────────────────────────────────────────────────── */

export function listPosts(
  opts: { managed_page?: string; status?: string; workspace: string },
): Promise<ScheduledPost[]> {
  const { workspace, ...rest } = opts;
  return serverFetch<ScheduledPost[]>(
    `/apis/socialmanager/posts/${toQueryString(rest)}`,
    wsOpts(workspace),
  );
}

export function getPost(nanoid: string, workspace: string): Promise<ScheduledPost> {
  return serverFetch<ScheduledPost>(
    `/apis/socialmanager/posts/${nanoid}/`,
    wsOpts(workspace),
  );
}

export function createPost(
  body: ScheduledPostForm,
  workspace: string,
): Promise<ScheduledPost> {
  return serverMutate<ScheduledPost>("/apis/socialmanager/posts/", { body, workspace });
}

export function updatePost(
  nanoid: string,
  body: Partial<ScheduledPostForm>,
  workspace: string,
): Promise<ScheduledPost> {
  return serverMutate<ScheduledPost>(`/apis/socialmanager/posts/${nanoid}/`, {
    body,
    method: "PATCH",
    workspace,
  });
}

export function deletePost(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/socialmanager/posts/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

export function publishPost(nanoid: string, workspace: string): Promise<ScheduledPost> {
  return serverMutate<ScheduledPost>(`/apis/socialmanager/posts/${nanoid}/publish/`, {
    body: {},
    workspace,
  });
}

export function cancelPost(nanoid: string, workspace: string): Promise<ScheduledPost> {
  return serverMutate<ScheduledPost>(`/apis/socialmanager/posts/${nanoid}/cancel/`, {
    body: {},
    workspace,
  });
}

export function duplicatePost(nanoid: string, workspace: string): Promise<ScheduledPost> {
  return serverMutate<ScheduledPost>(`/apis/socialmanager/posts/${nanoid}/duplicate/`, {
    body: {},
    workspace,
  });
}

export function startAiTailor(
  body: {
    platform: string;
    base_content: string;
    char_limit?: number | null;
    max_hashtags?: number | null;
    current_content?: string;
  },
  workspace: string,
): Promise<SyncTaskResult> {
  return serverMutate<SyncTaskResult>("/apis/socialmanager/posts/ai_tailor/", {
    body,
    workspace,
  });
}

export function getAiTailorStatus(
  taskId: string,
  workspace: string,
): Promise<{ status: string; result?: string | null }> {
  return serverFetch<{ status: string; result?: string | null }>(
    `/apis/socialmanager/posts/ai_tailor_status/?task_id=${encodeURIComponent(taskId)}`,
    wsOpts(workspace),
  );
}

export function syncPosts(
  body: { social_account?: string; managed_page?: string; limit?: number },
  workspace: string,
): Promise<SyncTaskResult> {
  return serverMutate<SyncTaskResult>("/apis/socialmanager/posts/sync/", {
    body,
    workspace,
  });
}

export function getPostsSyncStatus(
  taskId: string,
  workspace: string,
): Promise<PostsSyncStatusResult> {
  return serverFetch<PostsSyncStatusResult>(
    `/apis/socialmanager/posts/sync_status/?task_id=${encodeURIComponent(taskId)}`,
    wsOpts(workspace),
  );
}

export function syncComments(
  body: {
    social_account?: string;
    managed_page?: string;
    scheduled_post?: string;
    limit?: number;
  },
  workspace: string,
): Promise<SyncTaskResult> {
  return serverMutate<SyncTaskResult>("/apis/socialmanager/posts/sync_comments/", {
    body,
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Comments
 * ────────────────────────────────────────────────────────────────────── */

export function listPostComments(
  opts: { postNanoid: string; commentType?: PostCommentType; workspace: string },
): Promise<PostComment[]> {
  const { postNanoid, commentType, workspace } = opts;
  const params = new URLSearchParams({ scheduled_post: postNanoid });
  if (commentType) params.set("comment_type", commentType);
  return serverFetch<PostComment[]>(
    `/apis/socialmanager/comments/?${params.toString()}`,
    wsOpts(workspace),
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Hashtags
 * ────────────────────────────────────────────────────────────────────── */

export function listHashtags(workspace: string): Promise<Hashtag[]> {
  return serverFetch<Hashtag[]>("/apis/socialmanager/hashtags/", wsOpts(workspace));
}

export function createHashtag(
  body: { tag: string; category?: string },
  workspace: string,
): Promise<Hashtag> {
  return serverMutate<Hashtag>("/apis/socialmanager/hashtags/", { body, workspace });
}

/* ──────────────────────────────────────────────────────────────────────
 * Queues
 * ────────────────────────────────────────────────────────────────────── */

export function listQueues(workspace: string): Promise<PostQueue[]> {
  return serverFetch<PostQueue[]>("/apis/socialmanager/queues/", wsOpts(workspace));
}

export function createQueue(
  body: Partial<PostQueue>,
  workspace: string,
): Promise<PostQueue> {
  return serverMutate<PostQueue>("/apis/socialmanager/queues/", { body, workspace });
}

export function updateQueue(
  nanoid: string,
  body: Partial<PostQueue>,
  workspace: string,
): Promise<PostQueue> {
  return serverMutate<PostQueue>(`/apis/socialmanager/queues/${nanoid}/`, {
    body,
    method: "PATCH",
    workspace,
  });
}

export function deleteQueue(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/socialmanager/queues/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

export function scheduleQueue(nanoid: string, workspace: string): Promise<ScheduledPost[]> {
  return serverMutate<ScheduledPost[]>(`/apis/socialmanager/queues/${nanoid}/schedule/`, {
    body: {},
    workspace,
  });
}

/* ── Queue items ── */

export function listQueueItems(
  opts: { queue?: string; workspace: string },
): Promise<PostQueueItem[]> {
  const { workspace, ...rest } = opts;
  return serverFetch<PostQueueItem[]>(
    `/apis/socialmanager/queue-items/${toQueryString(rest)}`,
    wsOpts(workspace),
  );
}

export function createQueueItem(
  body: Partial<PostQueueItem>,
  workspace: string,
): Promise<PostQueueItem> {
  return serverMutate<PostQueueItem>("/apis/socialmanager/queue-items/", {
    body,
    workspace,
  });
}

export function updateQueueItem(
  nanoid: string,
  body: Partial<PostQueueItem>,
  workspace: string,
): Promise<PostQueueItem> {
  return serverMutate<PostQueueItem>(`/apis/socialmanager/queue-items/${nanoid}/`, {
    body,
    method: "PATCH",
    workspace,
  });
}

export function deleteQueueItem(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/socialmanager/queue-items/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Analytics
 * ────────────────────────────────────────────────────────────────────── */

export function listMetrics(
  opts: {
    managed_page?: string;
    metric?: string;
    since?: string;
    until?: string;
    workspace: string;
  },
): Promise<MetricSnapshot[]> {
  const { workspace, ...rest } = opts;
  return serverFetch<MetricSnapshot[]>(
    `/apis/socialmanager/metrics/${toQueryString(rest)}`,
    wsOpts(workspace),
  );
}

export function syncAnalytics(
  body: {
    social_account?: string;
    managed_page?: string;
    since?: string;
    until?: string;
    days?: number;
  },
  workspace: string,
): Promise<SyncTaskResult> {
  return serverMutate<SyncTaskResult>("/apis/socialmanager/metrics/sync/", {
    body,
    workspace,
  });
}

export function getAnalyticsSyncStatus(
  taskId: string,
  workspace: string,
): Promise<AnalyticsSyncStatusResult> {
  return serverFetch<AnalyticsSyncStatusResult>(
    `/apis/socialmanager/metrics/sync_status/?task_id=${encodeURIComponent(taskId)}`,
    wsOpts(workspace),
  );
}