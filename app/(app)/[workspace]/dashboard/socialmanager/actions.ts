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
  retryPost,
  cancelPost,
  getPost,
  duplicatePost,
  deletePost,
  getLivePostTaskStatus,
  pushRecipientUpdate,
  pushRecipientDelete,
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
  updateManagedChannel,
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
  editPostComment,
  hidePostComment,
  deletePostComment,
  createPostComment,
  replyPostComment,
  privateReplyPostComment,
} from "@/lib/api";
import type {
  CampaignForm,
  ScheduledPostForm,
  ScheduledPost,
  PostQueue,
  PostQueueItem,
  PostComment,
  DeletePostResult,
  LivePostTaskResult,
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

/** One recipient entry, as the composer builds it. Mirrors the backend's
 *  `PostRecipientSerializer` write shape and `ScheduledPostRecipientInput`. */
const RecipientInputSchema = z.object({
  managed_page: z.string().min(1, "Pick a channel for every entry."),
  content: z.string().optional(),
  media_urls: z.array(z.string()).optional(),
  media_assets: z.array(z.string()).optional(),
  link_url: z.string().optional(),
  format: z.string().optional(),
});

/** A JSON string that must actually parse, and must parse into `shape`.
 *
 * The composer sends its nested lists as JSON strings inside `FormData`, so
 * without this the only guard is `JSON.parse` throwing — which surfaces as a
 * 500 rather than a field error the composer can show. */
function jsonField<T extends z.ZodType>(shape: T, label: string) {
  return z
    .string()
    .optional()
    .transform((raw, ctx) => {
      if (!raw) return undefined;
      let value: unknown;
      try {
        value = JSON.parse(raw);
      } catch {
        ctx.addIssue({ code: "custom", message: `${label} is not valid JSON.` });
        return z.NEVER;
      }
      const result = shape.safeParse(value);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({ code: "custom", message: `${label}: ${issue.message}` });
        }
        return z.NEVER;
      }
      return result.data;
    });
}

const PostSchema = z.object({
  content: z.string().min(1, "Post content is required."),
  campaign: z.string().nullable().optional(),
  scheduled_at: z.string().optional(),
  status: z.string().optional(),
  format: z.string().optional(),
  media_urls: jsonField(z.array(z.string()), "Media URLs"),
  media_assets: jsonField(z.array(z.string()), "Media"),
  recipients: jsonField(z.array(RecipientInputSchema), "Channels"),
  first_comments: jsonField(z.record(z.string(), z.string()), "First comments"),
});

/** The same contract as {@link PostSchema}, for the edit path.
 *
 * `content` is optional here because an edit may only be moving a schedule or
 * swapping a channel; requiring it would block the partial saves the calendar
 * drag makes. */
const PostPatchSchema = PostSchema.partial();

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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
  return { status: "success", message: "Campaign deleted." };
}

/* ──────────────────────────────────────────────────────────────────────
 * Post actions
 * ────────────────────────────────────────────────────────────────────── */

export async function createPostAction(
  _prev: PostActionState,
  formData: FormData,
  workspace: string,
): Promise<PostActionState | { status: "success"; post: ScheduledPost }> {
  const parsed = PostSchema.safeParse({
    content: formData.get("content"),
    campaign: formData.get("campaign") || null,
    scheduled_at: formData.get("scheduled_at") || undefined,
    status: formData.get("status") || undefined,
    format: formData.get("format") || undefined,
    media_urls: formData.get("media_urls") || undefined,
    media_assets: formData.get("media_assets") || undefined,
    recipients: formData.get("recipients_json") || undefined,
    first_comments: formData.get("first_comments_json") || undefined,
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
      media_urls: parsed.data.media_urls,
      media_assets: parsed.data.media_assets,
      recipients: parsed.data.recipients,
      first_comments: parsed.data.first_comments,
    };

    const post = await createPost(payload, workspace);
    revalidatePath(`/${workspace}/dashboard/socialmanager`);
    return { status: "success", post };
  } catch (error) {
    // The backend owns the rules the client cannot know — that a reel needs a
    // video, that two channels are the same account. When it refuses, say what
    // it said instead of replacing it with "Failed to create post".
    return { status: "error", message: describePostError(error) };
  }
}

/**
 * Turn a failed post call into something worth showing.
 *
 * `serverMutate` throws `ServerFetchError`, whose `body` is the raw response
 * *text* — not a parsed object. Reading `body.errors` off it therefore always
 * found `undefined` and every refusal was reported as "Failed to save post.",
 * which is how a retry could be refused by the backend ("Only a failed post can
 * be retried", "This post has no failed channels to retry") while the user was
 * told something else entirely. Parse the text first, then read the two shapes
 * the backend actually sends:
 *
 *   * `{error, error_type}` — what the publish/retry/cancel endpoints return.
 *   * `{errors: [{attr, detail}]}` — DRF's `drf_standardized_errors`, which is
 *     where a serializer refusal puts the real reason ("A reel needs a video").
 */
function describePostError(error: unknown, fallback = "Failed to save post."): string {
  const body = parseErrorBody((error as { body?: unknown } | null)?.body);
  if (body) {
    const details = [
      body.error,
      ...(Array.isArray(body.errors)
        ? body.errors.map((entry) =>
            entry && typeof entry === "object"
              ? (entry as { detail?: unknown }).detail
              : entry,
          )
        : []),
    ]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);
    if (details.length) return details.join(" ");
  }
  return fallback;
}

/** Read a `ServerFetchError` body into an object, whether it arrived as JSON
 *  text or already parsed. Unparseable bodies yield null, not a throw. */
function parseErrorBody(body: unknown): Record<string, unknown> | null {
  if (body && typeof body === "object") return body as Record<string, unknown>;
  if (typeof body !== "string" || !body.trim()) return null;
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    // A proxy error page rather than a JSON body: show nothing rather than
    // dumping HTML into the banner.
    return null;
  }
}

/**
 * Re-read a post after a delivery action.
 *
 * The response of a delivery action is authoritative — the backend re-reads the
 * row so it describes the delivery that just ran — but the UI re-reads too, for
 * one reason: the frontend and the backend deploy independently here. Against a
 * backend that still serves the recipients it prefetched *before* the delivery
 * (the bug this guards), a successful retry would render as the same failure,
 * keep the Retry button on screen, and the next click would re-post the same
 * content to channels that had already succeeded. One extra GET costs less than
 * a duplicate post on a live account.
 */
async function rereadPost(
  nanoid: string,
  workspace: string,
  fallback: ScheduledPost,
): Promise<ScheduledPost> {
  return getPost(nanoid, workspace).catch(() => fallback);
}

/**
 * Invalidate both the list route and the post's own detail route.
 *
 * `revalidatePath("/…/socialmanager")` only covers the index segment, so the
 * detail page — which server-fetches the post in `[postId]/page.tsx` — kept its
 * cached render and went back to showing the pre-retry failure on the next
 * navigation.
 */
function revalidatePostPaths(nanoid: string, workspace: string): void {
  const base = `/${workspace}/dashboard/socialmanager`;
  revalidatePath(base);
  revalidatePath(`${base}/${nanoid}`);
}

export async function updatePostAction(
  nanoid: string,
  body: Partial<ScheduledPostForm>,
  workspace: string,
): Promise<PostActionState> {
  // Validated here because this is the path an edit takes, and an edit is the
  // one that reconciles a delivered post's channels — a malformed recipient
  // list reaching that code could drop a channel the user did not touch.
  const parsed = PostPatchSchema.safeParse(body);
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    await updatePost(nanoid, parsed.data, workspace);
  } catch (error) {
    return { status: "error", message: describePostError(error) };
  }

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
  return { status: "success", message: "Post updated." };
}

export async function publishPostAction(
  nanoid: string,
  workspace: string,
): Promise<PostActionState | { status: "success"; post: ScheduledPost }> {
  let post: ScheduledPost;
  try {
    post = await publishPost(nanoid, workspace);
  } catch (error) {
    return { status: "error", message: describePostError(error, "Failed to publish post.") };
  }

  const fresh = await rereadPost(nanoid, workspace, post);
  revalidatePostPaths(nanoid, workspace);
  return { status: "success", post: fresh };
}

export async function retryPostAction(
  nanoid: string,
  workspace: string,
): Promise<PostActionState | { status: "success"; post: ScheduledPost }> {
  let post: ScheduledPost;
  try {
    post = await retryPost(nanoid, workspace);
  } catch (error) {
    // The backend refuses a retry with nothing to retry, and says why in the
    // body. Pass that through: "this post has no failed channels" is a very
    // different thing for the user to read than "Failed to retry post."
    return { status: "error", message: describePostError(error, "Failed to retry post.") };
  }

  // Read the post back rather than trusting the delivery response alone: if any
  // caller still hands back pre-delivery channel states, a successful retry
  // would render as the same failure and leave the Retry button on screen, one
  // click away from a duplicate post.
  const fresh = await rereadPost(nanoid, workspace, post);
  revalidatePostPaths(nanoid, workspace);
  return { status: "success", post: fresh };
}

export async function cancelPostAction(
  nanoid: string,
  workspace: string,
): Promise<PostActionState | { status: "success"; post: ScheduledPost }> {
  let post: ScheduledPost;
  try {
    post = await cancelPost(nanoid, workspace);
  } catch (error) {
    return { status: "error", message: describePostError(error, "Failed to cancel post.") };
  }

  const fresh = await rereadPost(nanoid, workspace, post);
  revalidatePostPaths(nanoid, workspace);
  return { status: "success", post: fresh };
}

export async function duplicatePostAction(
  nanoid: string,
  workspace: string,
): Promise<PostActionState | { status: "success"; post: ScheduledPost }> {
  let post: ScheduledPost;
  try {
    post = await duplicatePost(nanoid, workspace);
  } catch {
    return { status: "error", message: "Failed to duplicate post." };
  }

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
  return { status: "success", post };
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

export async function disconnectChannelAction(
  nanoid: string,
  workspace: string,
): Promise<AccountActionState> {
  try {
    await updateManagedChannel(nanoid, { is_active: false }, workspace);
  } catch {
    return { status: "error", message: "Failed to disconnect channel." };
  }

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
  return { status: "success", message: "Channel disconnected." };
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
  return { status: "success", message: "Platform created." };
}

export async function updatePlatformAction(
  nanoid: string,
  body: Record<string, unknown>,
  workspace: string,
): Promise<PlatformActionState> {
  try {
    await updatePlatform(nanoid, body, workspace);
  } catch (err) {
    // TEMP DEBUG 2026-10-01: the bare catch here hid the real cause and the
    // UI showed a generic message. Remove once the platform-config save works.
    console.error("[updatePlatformAction] PATCH failed", {
      nanoid,
      workspace,
      body,
      err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return {
      status: "error",
      message: `Failed to update platform: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  // TEMP DEBUG 2026-10-01: revalidatePath is the only statement outside the
  // try above, so a throw here propagates to the client and surfaces as the
  // generic "Something went wrong on the server" — hiding the cause.
  try {
    revalidatePath(`/${workspace}/dashboard/socialmanager`);
  } catch (err) {
    console.error("[updatePlatformAction] revalidatePath failed", {
      nanoid,
      workspace,
      path: `/${workspace}/dashboard/socialmanager`,
      err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    // The mutation already committed; only the cache refresh failed. Report it
    // rather than claiming success, so the cause is visible either way.
    return {
      status: "error",
      message: `Platform saved but revalidation failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
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

  revalidatePath(`/${workspace}/dashboard/socialmanager`);
  return { status: "success", message: "Media spec deleted." };
}

export async function deletePostAction(
  nanoid: string,
  workspace: string,
): Promise<{ status: string; message?: string; task_id?: string }> {
  let result: DeletePostResult;
  try {
    result = await deletePost(nanoid, workspace);
  } catch (error) {
    return {
      status: "error",
      message: describePostError(error, "Failed to delete post."),
    };
  }

  revalidatePath(`/${workspace}/dashboard/socialmanager`);

  if (!result?.task_id) {
    // 204: nothing was live on the platform, so the row is already gone.
    return { status: "success", message: "Post deleted." };
  }

  // 202: the backend still has to call Graph once per page. The caller polls
  // this task id and only navigates once it settles — leaving now would strand
  // the user on a list showing a post whose deletion has not finished.
  return {
    status: "success",
    task_id: result.task_id,
    message: `Deleting from ${result.live_pages ?? "each"} page(s)…`,
  };
}

/* ──────────────────────────────────────────────────────────────────────
 * Live post edits — pushing copy to a post that is already on the Page
 *
 * These are the counterpart of `updatePostAction`, which writes the master copy
 * locally only. A row that reads as edited while the Page still shows the old
 * text is invisible to everyone except the audience, so both of these reach
 * Meta first and resolve as "queued" — the change is NOT applied when they
 * resolve, and the caller polls the task rather than treating a resolved
 * promise as success.
 * ────────────────────────────────────────────────────────────────────── */

const RecipientEditSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post content is required."),
});

export async function pushRecipientUpdateAction(
  recipientNanoid: string,
  content: string,
  workspace: string,
): Promise<{ status: string; task_id?: string; message?: string }> {
  const parsed = RecipientEditSchema.safeParse({ content });
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: fieldErrors.content?.[0] ?? "Post content is required.",
    };
  }

  try {
    const { task_id } = await pushRecipientUpdate(
      recipientNanoid,
      { content: parsed.data.content },
      workspace,
    );
    return { status: "success", task_id };
  } catch (error) {
    return {
      status: "error",
      message: describePostError(error, "Could not update the page copy."),
    };
  }
}

export async function pushRecipientDeleteAction(
  recipientNanoid: string,
  workspace: string,
): Promise<{ status: string; task_id?: string; message?: string }> {
  try {
    const { task_id } = await pushRecipientDelete(recipientNanoid, workspace);
    return { status: "success", task_id };
  } catch (error) {
    return {
      status: "error",
      message: describePostError(error, "Could not delete the page copy."),
    };
  }
}

/**
 * Poll one live-post task to completion.
 *
 * Terminal once Celery answers `SUCCESS` or `FAILURE`; `result.error` then
 * carries the platform's refusal verbatim, which is the only way to explain why
 * an edit did not take effect. `warning`/`warnings` report a copy whose
 * platform has no delete API.
 */
export async function getLivePostTaskStatusAction(
  taskId: string,
  workspace: string,
): Promise<{ status: string; result?: LivePostTaskResult | null }> {
  return getLivePostTaskStatus(taskId, workspace);
}

/**
 * Re-read a post after a background task has settled.
 *
 * Returns `null` rather than falling back to the caller's stale copy: the whole
 * point is to show the state the task produced, and a fallback would silently
 * keep rendering the pre-task values.
 */
export async function getPostAction(
  nanoid: string,
  workspace: string,
): Promise<ScheduledPost | null> {
  try {
    return await getPost(nanoid, workspace);
  } catch {
    return null;
  }
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

/* ──────────────────────────────────────────────────────────────────────
 * Writing comments
 *
 * All three queue a Celery task and resolve before the platform has been
 * called. The change is NOT applied when these resolve — the row still holds
 * its old value — so the caller polls the task rather than treating a resolved
 * promise as success. See `002` §2 B1 for why a resolved promise here means
 * "queued", not "done".
 * ────────────────────────────────────────────────────────────────────── */

const CommentBodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment text is required.")
    .max(5000, "Comment is too long (5000 characters max)."),
});

export async function createPostCommentAction(
  recipient: string,
  content: string,
  workspace: string,
): Promise<{ status: string; task_id?: string; message?: string }> {
  if (!recipient) {
    return {
      status: "error",
      message: "Pick a channel to comment on.",
    };
  }
  const parsed = CommentBodySchema.safeParse({ content });
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: fieldErrors.content?.[0] ?? "Comment text is required.",
    };
  }

  try {
    const { task_id } = await createPostComment(
      { recipient, content: parsed.data.content },
      workspace,
    );
    return { status: "success", task_id };
  } catch (error) {
    return {
      status: "error",
      message: describePostError(error, "Could not post the comment."),
    };
  }
}

export async function replyPostCommentAction(
  nanoid: string,
  text: string,
  workspace: string,
): Promise<{ status: string; task_id?: string; message?: string }> {
  const parsed = CommentBodySchema.safeParse({ content: text });
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: fieldErrors.content?.[0] ?? "Reply text is required.",
    };
  }

  try {
    const { task_id } = await replyPostComment(
      nanoid,
      { text: parsed.data.content },
      workspace,
    );
    return { status: "success", task_id };
  } catch (error) {
    return {
      status: "error",
      message: describePostError(error, "Could not send the reply."),
    };
  }
}

/**
 * Send a private direct reply.
 *
 * A 400 from the backend is not a generic failure here — it is the platform's
 * rule being quoted back ("already been sent", "within 7 days"), because those
 * are the refusals a user can actually do something about. `describePostError`
 * passes the server's message through, so it surfaces verbatim.
 */
export async function privateReplyPostCommentAction(
  nanoid: string,
  text: string,
  workspace: string,
): Promise<{ status: string; task_id?: string; message?: string }> {
  const parsed = CommentBodySchema.safeParse({ content: text });
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: fieldErrors.content?.[0] ?? "Message text is required.",
    };
  }

  try {
    const { task_id } = await privateReplyPostComment(
      nanoid,
      { text: parsed.data.content },
      workspace,
    );
    return { status: "success", task_id };
  } catch (error) {
    return {
      status: "error",
      message: describePostError(
        error,
        "Could not send the private reply.",
      ),
    };
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * Comment moderation
 *
 * Each of these queues a platform call and returns its Celery task id. The
 * change is NOT applied when these resolve — the row still holds its old value
 * — so the caller refreshes once the task reports back rather than treating a
 * resolved promise as success.
 * ────────────────────────────────────────────────────────────────────── */

const CommentEditSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment text is required.")
    .max(5000, "Comment is too long (5000 characters max)."),
});

export async function editPostCommentAction(
  nanoid: string,
  content: string,
  workspace: string,
): Promise<{ status: string; task_id?: string; message?: string }> {
  const parsed = CommentEditSchema.safeParse({ content });
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: fieldErrors.content?.[0] ?? "Comment text is required.",
    };
  }

  try {
    const { task_id } = await editPostComment(
      nanoid,
      { content: parsed.data.content },
      workspace,
    );
    return { status: "success", task_id };
  } catch (error) {
    return {
      status: "error",
      message: describePostError(error, "Could not edit the comment."),
    };
  }
}

export async function hidePostCommentAction(
  nanoid: string,
  hidden: boolean,
  workspace: string,
): Promise<{ status: string; task_id?: string; message?: string }> {
  try {
    const { task_id } = await hidePostComment(nanoid, { hidden }, workspace);
    return { status: "success", task_id };
  } catch (error) {
    return {
      status: "error",
      message: describePostError(error, "Could not hide the comment."),
    };
  }
}

export async function deletePostCommentAction(
  nanoid: string,
  workspace: string,
): Promise<{ status: string; task_id?: string; message?: string }> {
  try {
    const { task_id } = await deletePostComment(nanoid, workspace);
    // The row is removed by the task, not here, so the post detail route is
    // revalidated on the *next* render after the task lands. Revalidating now
    // would re-render the same unchanged list and look like nothing happened.
    return { status: "success", task_id };
  } catch (error) {
    return {
      status: "error",
      message: describePostError(error, "Could not delete the comment."),
    };
  }
}
