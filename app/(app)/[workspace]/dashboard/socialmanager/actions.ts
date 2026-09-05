"use server";

import { z, flattenError } from "zod";
import { revalidatePath } from "next/cache";

import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  createPost,
  updatePost,
  publishPost,
  cancelPost,
  duplicatePost,
  startAiTailor,
  createHashtag,
  createQueue,
  updateQueue,
  deleteQueue,
  scheduleQueue,
  createQueueItem,
  updateQueueItem,
  deleteQueueItem,
  deleteAccount,
  syncAccount,
  revokeAccount,
  oauthInit,
  getConnectedInstagram,
  verifyPage,
  syncPosts,
  getPostsSyncStatus,
  syncAnalytics,
  getAnalyticsSyncStatus,
  createPlatform,
  updatePlatform,
  deletePlatform,
  createContentFormat,
  updateContentFormat,
  deleteContentFormat,
  createConstraint,
  updateConstraint,
  deleteConstraint,
  createMediaSpec,
  updateMediaSpec,
  deleteMediaSpec,
  listPostComments,
  syncComments,
} from "@/lib/api";
import type {
  CampaignForm,
  ScheduledPostForm,
  PostQueue,
  PostQueueItem,
  PostComment,
} from "@/lib/api/types";
import type {
  CampaignActionState,
  PostActionState,
  QueueActionState,
  QueueItemActionState,
  AccountActionState,
  PlatformActionState,
} from "./action-state";
import {
  initialCampaignState,
  initialPostState,
  initialQueueState,
  initialQueueItemState,
  initialAccountState,
  initialPlatformState,
} from "./action-state";

const CampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required."),
  description: z.string().optional(),
  is_active: z.coerce.boolean().default(true),
});

const PostSchema = z.object({
  content: z.string().min(1, "Post content is required."),
  campaign: z.string().nullable().optional(),
  scheduled_at: z.string().optional(),
  status: z.string().optional(),
  format: z.string().optional(),
  media_urls: z.string().optional(),
  recipients_json: z.string().optional(),
  first_comments_json: z.string().optional(),
});

const HashtagSchema = z.object({
  tag: z.string().min(1, "Tag is required."),
  category: z.string().optional(),
});

const QueueSchema = z.object({
  name: z.string().min(1, "Queue name is required."),
  managed_page: z.string().nullable().optional(),
});

const QueueItemSchema = z.object({
  queue: z.string().min(1, "Queue ID is required."),
  scheduled_post: z.string().nullable().optional(),
  position: z.coerce.number().int().default(0),
  interval_minutes: z.coerce.number().int().min(0).default(0),
});

export async function oauthInitAction(
  body: { platform: string; rerequest?: boolean; method?: string },
  workspace: string,
): Promise<{ auth_url: string; state: string } | { error: string }> {
  try {
    return await oauthInit(body, workspace);
  } catch {
    return { error: "Failed to initialize OAuth." };
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * Campaign actions
 * ────────────────────────────────────────────────────────────────────── */

export async function createCampaignAction(
  _prev: CampaignActionState,
  formData: FormData,
  workspace: string,
): Promise<CampaignActionState> {
  const parsed = CampaignSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    is_active: formData.get("is_active"),
  });

  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  try {
    await createCampaign(parsed.data as CampaignForm, workspace);
  } catch {
    return { status: "error", message: "Failed to create campaign." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Campaign created." };
}

export async function updateCampaignAction(
  nanoid: string,
  body: Partial<CampaignForm>,
  workspace: string,
): Promise<CampaignActionState> {
  try {
    await updateCampaign(nanoid, body, workspace);
  } catch {
    return { status: "error", message: "Failed to update campaign." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Campaign updated." };
}

export async function deleteCampaignAction(
  nanoid: string,
  workspace: string,
): Promise<CampaignActionState> {
  try {
    await deleteCampaign(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to delete campaign." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Campaign deleted." };
}

/* ──────────────────────────────────────────────────────────────────────
 * Post actions
 * ────────────────────────────────────────────────────────────────────── */

export async function createPostAction(
  _prev: PostActionState,
  formData: FormData,
  workspace: string,
): Promise<PostActionState> {
  const parsed = PostSchema.safeParse({
    content: formData.get("content"),
    campaign: formData.get("campaign") || null,
    scheduled_at: formData.get("scheduled_at") || undefined,
    status: formData.get("status") || undefined,
    format: formData.get("format") || undefined,
    media_urls: formData.get("media_urls") || undefined,
    recipients_json: formData.get("recipients_json") || undefined,
    first_comments_json: formData.get("first_comments_json") || undefined,
  });

  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  try {
    const payload: ScheduledPostForm = {
      content: parsed.data.content,
      campaign: parsed.data.campaign ?? undefined,
      scheduled_at: parsed.data.scheduled_at || undefined,
      status: parsed.data.status || undefined,
      format: parsed.data.format || undefined,
      media_urls: parsed.data.media_urls ? JSON.parse(parsed.data.media_urls) : undefined,
      recipients: parsed.data.recipients_json
        ? JSON.parse(parsed.data.recipients_json)
        : undefined,
      first_comments: parsed.data.first_comments_json
        ? JSON.parse(parsed.data.first_comments_json)
        : undefined,
    };

    await createPost(payload, workspace);
  } catch {
    return { status: "error", message: "Failed to create post." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Post created." };
}

export async function updatePostAction(
  nanoid: string,
  body: Partial<ScheduledPostForm>,
  workspace: string,
): Promise<PostActionState> {
  try {
    await updatePost(nanoid, body, workspace);
  } catch {
    return { status: "error", message: "Failed to update post." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Post updated." };
}

export async function publishPostAction(
  nanoid: string,
  workspace: string,
): Promise<PostActionState> {
  try {
    await publishPost(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to publish post." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Post published." };
}

export async function cancelPostAction(
  nanoid: string,
  workspace: string,
): Promise<PostActionState> {
  try {
    await cancelPost(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to cancel post." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Post cancelled." };
}

export async function duplicatePostAction(
  nanoid: string,
  workspace: string,
): Promise<PostActionState> {
  try {
    await duplicatePost(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to duplicate post." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Post duplicated." };
}

export async function startAiTailorAction(
  body: {
    platform: string;
    base_content: string;
    char_limit?: number | null;
    max_hashtags?: number | null;
    current_content?: string;
  },
  workspace: string,
): Promise<{ task_id: string } | { error: string }> {
  try {
    return await startAiTailor(body, workspace);
  } catch {
    return { error: "Failed to start AI tailor." };
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * Hashtag actions
 * ────────────────────────────────────────────────────────────────────── */

export async function createHashtagAction(
  _prev: { status: string; message?: string },
  formData: FormData,
  workspace: string,
): Promise<{ status: string; message?: string }> {
  const parsed = HashtagSchema.safeParse({
    tag: formData.get("tag"),
    category: formData.get("category") || undefined,
  });

  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: fieldErrors.tag?.[0] ?? "Invalid input." };
  }

  try {
    await createHashtag(parsed.data, workspace);
  } catch {
    return { status: "error", message: "Failed to create hashtag." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: `Hashtag #${parsed.data.tag} created.` };
}

/* ──────────────────────────────────────────────────────────────────────
 * Queue actions
 * ────────────────────────────────────────────────────────────────────── */

export async function createQueueAction(
  _prev: QueueActionState,
  formData: FormData,
  workspace: string,
): Promise<QueueActionState> {
  const parsed = QueueSchema.safeParse({
    name: formData.get("name"),
    managed_page: formData.get("managed_page") || null,
  });

  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  try {
    await createQueue(parsed.data as Partial<PostQueue>, workspace);
  } catch {
    return { status: "error", message: "Failed to create queue." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Queue created." };
}

export async function updateQueueAction(
  nanoid: string,
  body: Partial<PostQueue>,
  workspace: string,
): Promise<QueueActionState> {
  try {
    await updateQueue(nanoid, body, workspace);
  } catch {
    return { status: "error", message: "Failed to update queue." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Queue updated." };
}

export async function deleteQueueAction(
  nanoid: string,
  workspace: string,
): Promise<QueueActionState> {
  try {
    await deleteQueue(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to delete queue." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Queue deleted." };
}

export async function scheduleQueueAction(
  nanoid: string,
  workspace: string,
): Promise<QueueActionState> {
  try {
    await scheduleQueue(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to schedule queue." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Queue scheduled for publishing." };
}

/* ── Queue items ── */

export async function createQueueItemAction(
  body: Partial<PostQueueItem>,
  workspace: string,
): Promise<QueueItemActionState> {
  try {
    await createQueueItem(body, workspace);
  } catch {
    return { status: "error", message: "Failed to add item to queue." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Item added to queue." };
}

export async function updateQueueItemAction(
  nanoid: string,
  body: Partial<PostQueueItem>,
  workspace: string,
): Promise<QueueItemActionState> {
  try {
    await updateQueueItem(nanoid, body, workspace);
  } catch {
    return { status: "error", message: "Failed to update queue item." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Queue item updated." };
}

export async function deleteQueueItemAction(
  nanoid: string,
  workspace: string,
): Promise<QueueItemActionState> {
  try {
    await deleteQueueItem(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to remove queue item." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Queue item removed." };
}

/* ──────────────────────────────────────────────────────────────────────
 * Account / Channel actions
 * ────────────────────────────────────────────────────────────────────── */

export async function syncAccountAction(
  nanoid: string,
  workspace: string,
): Promise<AccountActionState> {
  try {
    await syncAccount(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to sync account." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Account synced." };
}

export async function revokeAccountAction(
  nanoid: string,
  workspace: string,
): Promise<AccountActionState> {
  try {
    await revokeAccount(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to revoke account." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Account disconnected." };
}

export async function deleteAccountAction(
  nanoid: string,
  workspace: string,
): Promise<AccountActionState> {
  try {
    await deleteAccount(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to delete account." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Account deleted." };
}

export async function verifyPageAction(
  nanoid: string,
  workspace: string,
): Promise<{ ok: boolean; error?: string; error_type?: string }> {
  try {
    return await verifyPage(nanoid, workspace);
  } catch {
    return { ok: false, error: "Verification request failed." };
  }
}

export async function getConnectedInstagramAction(
  nanoid: string,
  workspace: string,
): Promise<{ page_id: string | null; instagram_business_account: { id: string } | null; connected: boolean } | null> {
  try {
    return await getConnectedInstagram(nanoid, workspace);
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * Sync actions (trigger background tasks)
 * ────────────────────────────────────────────────────────────────────── */

export async function syncPostsAction(
  body: { social_account?: string; managed_page?: string; limit?: number },
  workspace: string,
): Promise<{ task_id: string } | { error: string }> {
  try {
    return await syncPosts(body, workspace);
  } catch {
    return { error: "Failed to start post sync." };
  }
}

export async function syncAnalyticsAction(
  body: {
    social_account?: string;
    managed_page?: string;
    since?: string;
    until?: string;
    days?: number;
  },
  workspace: string,
): Promise<{ task_id: string } | { error: string }> {
  try {
    return await syncAnalytics(body, workspace);
  } catch {
    return { error: "Failed to start analytics sync." };
  }
}

export async function getPostsSyncStatusAction(
  taskId: string,
  workspace: string,
): Promise<{
  status: string;
  result?: { created: number; skipped: number; errors: { page: string; error: string }[] } | null;
}> {
  return getPostsSyncStatus(taskId, workspace);
}

export async function getAnalyticsSyncStatusAction(
  taskId: string,
  workspace: string,
): Promise<{
  status: string;
  result?: {
    created: number;
    updated: number;
    since: string;
    until: string;
    errors: { page: string; error: string }[];
  } | null;
}> {
  return getAnalyticsSyncStatus(taskId, workspace);
}

/* ──────────────────────────────────────────────────────────────────────
 * Platform config actions (admin)
 * ────────────────────────────────────────────────────────────────────── */

export async function createPlatformAction(
  body: Record<string, unknown>,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await createPlatform(body, workspace);
  } catch {
    return { status: "error", message: "Failed to create platform." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Platform created." };
}

export async function updatePlatformAction(
  nanoid: string,
  body: Record<string, unknown>,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await updatePlatform(nanoid, body, workspace);
  } catch {
    return { status: "error", message: "Failed to update platform." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Platform updated." };
}

export async function deletePlatformAction(
  nanoid: string,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await deletePlatform(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to delete platform." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Platform deleted." };
}

export async function createContentFormatAction(
  body: Record<string, unknown>,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await createContentFormat(body, workspace);
  } catch {
    return { status: "error", message: "Failed to create content format." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Content format created." };
}

export async function updateContentFormatAction(
  nanoid: string,
  body: Record<string, unknown>,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await updateContentFormat(nanoid, body, workspace);
  } catch {
    return { status: "error", message: "Failed to update content format." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Content format updated." };
}

export async function deleteContentFormatAction(
  nanoid: string,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await deleteContentFormat(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to delete content format." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Content format deleted." };
}

export async function createConstraintAction(
  body: Record<string, unknown>,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await createConstraint(body, workspace);
  } catch {
    return { status: "error", message: "Failed to create constraint." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Constraint created." };
}

export async function updateConstraintAction(
  nanoid: string,
  body: Record<string, unknown>,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await updateConstraint(nanoid, body, workspace);
  } catch {
    return { status: "error", message: "Failed to update constraint." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Constraint updated." };
}

export async function deleteConstraintAction(
  nanoid: string,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await deleteConstraint(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to delete constraint." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Constraint deleted." };
}

export async function createMediaSpecAction(
  body: Record<string, unknown>,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await createMediaSpec(body, workspace);
  } catch {
    return { status: "error", message: "Failed to create media spec." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Media spec created." };
}

export async function updateMediaSpecAction(
  nanoid: string,
  body: Record<string, unknown>,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await updateMediaSpec(nanoid, body, workspace);
  } catch {
    return { status: "error", message: "Failed to update media spec." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Media spec updated." };
}

export async function deleteMediaSpecAction(
  nanoid: string,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await deleteMediaSpec(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to delete media spec." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Media spec deleted." };
}

/* ──────────────────────────────────────────────────────────────────────
 * Comment actions
 * ────────────────────────────────────────────────────────────────────── */

export async function listPostCommentsAction(
  postNanoid: string,
  workspace: string,
): Promise<PostComment[]> {
  return listPostComments({ postNanoid, workspace });
}

export async function syncCommentsAction(
  body: { scheduled_post?: string; managed_page?: string },
  workspace: string,
): Promise<{ task_id: string } | { error: string }> {
  try {
    return await syncComments(body, workspace);
  } catch {
    return { error: "Failed to start comment sync." };
  }
}
