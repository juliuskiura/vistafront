import { serverFetch, serverMutate } from "./server-fetch";
import { toQueryString } from "./query-string";
import type { Attachment, Paginated } from "./types";

/**
 * The generic attachments client.
 *
 * The upload itself is multipart, which the JSON-only `serverMutate` base
 * cannot carry, so it goes through a Server Action that hands the form to
 * `serverMutateFormData`. Reading and deleting are plain JSON calls and
 * live here.
 *
 * `target_type` is the backend's short model name — `project` or `task`
 * (`projectmanager/generic_targets.py::TARGET_MODEL_MAP`).
 */
export type AttachmentTargetType = "project" | "task";

function unwrap<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as Paginated<T>).results)) {
    return (payload as Paginated<T>).results;
  }
  return [];
}

/** List the files attached to one record. */
export async function listAttachments(
  targetType: AttachmentTargetType,
  targetNanoid: string,
  workspace: string,
): Promise<Attachment[]> {
  const payload = await serverFetch<Attachment[] | Paginated<Attachment>>(
    `/apis/attachments/${toQueryString({
      target_type: targetType,
      target_nanoid: targetNanoid,
    })}`,
    { workspace },
  );
  return unwrap(payload);
}

/**
 * Delete an attachment.
 *
 * The backend removes the stored file and soft-deletes the row.
 */
export async function deleteAttachment(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate(`/apis/attachments/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}
