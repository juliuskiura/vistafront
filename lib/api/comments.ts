import { serverFetch, serverMutate } from "./server-fetch";
import { toQueryString } from "./query-string";
import type { Comment, Paginated } from "./types";

/**
 * The generic comments client.
 *
 * The backend's `Comment` model is a generic foreign key: it points at any
 * record through `content_type` + `object_id`, and the API exposes it as
 * `{ target_type, target_nanoid }`. The frontend therefore never deals with
 * a numeric id — it always addresses the target by nanoid.
 *
 * `target_type` is the backend's short model name, not an app-qualified
 * label: `project` or `task`
 * (`projectmanager/generic_targets.py::TARGET_MODEL_MAP`).
 */
export type CommentTargetType = "project" | "task";

function unwrap<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as Paginated<T>).results)) {
    return (payload as Paginated<T>).results;
  }
  return [];
}

/**
 * List the comments on one record.
 *
 * The backend's list view answers an empty page unless **both** the type
 * and the nanoid are supplied, so neither may be optional here.
 */
export async function listComments(
  targetType: CommentTargetType,
  targetNanoid: string,
  workspace: string,
): Promise<Comment[]> {
  const payload = await serverFetch<Comment[] | Paginated<Comment>>(
    `/apis/comments/${toQueryString({
      target_type: targetType,
      target_nanoid: targetNanoid,
    })}`,
    { workspace },
  );
  return unwrap(payload);
}

/** Post a comment on a record. */
export async function createComment(
  body: {
    target_type: CommentTargetType;
    target_nanoid: string;
    text: string;
  },
  workspace: string,
): Promise<Comment> {
  return serverMutate<Comment>("/apis/comments/", {
    body,
    method: "POST",
    workspace,
  });
}

/**
 * Delete a comment.
 *
 * The backend soft-deletes it (the row is flagged `deleted` and drops out of
 * every list), so a failed delete is not recoverable by re-posting.
 */
export async function deleteComment(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate(`/apis/comments/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}
