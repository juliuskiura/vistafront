import { serverFetch, serverMutate } from "../server-fetch";
import { toQueryString } from "../query-string";
import type {
  CreateDeliverableBody,
  Deliverable,
  DeliverableSummary,
  MergeSuggestion,
  Paginated,
  UpdateDeliverableBody,
} from "../types";
import { unwrap } from "./shared";

/**
 * The deliverable endpoints, including the publish workflow.
 *
 * The workflow is a one-way ladder: `draft` → `review` → `approved` →
 * `published`, with `revisions` as the loop back. The backend exposes one
 * action per step, and which step is offered follows from the
 * deliverable's current status.
 */

export async function listDeliverables(
  opts: { project?: string; type?: string; workspace: string },
): Promise<DeliverableSummary[]> {
  const { workspace, ...rest } = opts;
  const payload = await serverFetch<
    DeliverableSummary[] | Paginated<DeliverableSummary>
  >(`/apis/projectmanager/deliverables/${toQueryString(rest)}`, { workspace });
  return unwrap(payload);
}

export function getDeliverable(
  nanoid: string,
  workspace: string,
): Promise<Deliverable> {
  return serverFetch<Deliverable>(
    `/apis/projectmanager/deliverables/${nanoid}/`,
    { workspace },
  );
}

export async function createDeliverable(
  body: CreateDeliverableBody,
  workspace: string,
): Promise<Deliverable> {
  return serverMutate<Deliverable>("/apis/projectmanager/deliverables/", {
    body,
    method: "POST",
    workspace,
  });
}

export async function updateDeliverable(
  nanoid: string,
  body: UpdateDeliverableBody,
  workspace: string,
): Promise<Deliverable> {
  return serverMutate<Deliverable>(
    `/apis/projectmanager/deliverables/${nanoid}/`,
    { body, method: "PATCH", workspace },
  );
}

export async function deleteDeliverable(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate(`/apis/projectmanager/deliverables/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

/**
 * Complete a deliverable. The backend marks its tasks done and recomputes
 * the project.
 */
export async function completeDeliverable(
  nanoid: string,
  workspace: string,
): Promise<Deliverable> {
  return serverMutate<Deliverable>(
    `/apis/projectmanager/deliverables/${nanoid}/complete/`,
    { body: {}, method: "PATCH", workspace },
  );
}

/** Move a deliverable into review. */
export async function submitReview(
  nanoid: string,
  workspace: string,
): Promise<Deliverable> {
  return serverMutate<Deliverable>(
    `/apis/projectmanager/deliverables/${nanoid}/submit_review/`,
    { body: {}, method: "PATCH", workspace },
  );
}

/**
 * Approve a deliverable. The backend records the signed-in user as the
 * reviewer and stores the notes.
 */
export async function approveDeliverable(
  nanoid: string,
  reviewNotes: string,
  workspace: string,
): Promise<Deliverable> {
  return serverMutate<Deliverable>(
    `/apis/projectmanager/deliverables/${nanoid}/approve/`,
    { body: { review_notes: reviewNotes }, method: "PATCH", workspace },
  );
}

/** Send a deliverable back for revisions, with notes. */
export async function requestRevisions(
  nanoid: string,
  reviewNotes: string,
  workspace: string,
): Promise<Deliverable> {
  return serverMutate<Deliverable>(
    `/apis/projectmanager/deliverables/${nanoid}/request_revisions/`,
    { body: { review_notes: reviewNotes }, method: "PATCH", workspace },
  );
}

/** Mark an approved deliverable as published. */
export async function publishDeliverable(
  nanoid: string,
  workspace: string,
): Promise<Deliverable> {
  return serverMutate<Deliverable>(
    `/apis/projectmanager/deliverables/${nanoid}/publish/`,
    { body: {}, method: "PATCH", workspace },
  );
}

/**
 * Ask the AI service for a merged title and description for a set of
 * deliverables. Answers `502` when no AI model is configured.
 */
export async function suggestDeliverableMerge(
  deliverableIds: string[],
  workspace: string,
): Promise<MergeSuggestion> {
  return serverMutate<MergeSuggestion>(
    "/apis/projectmanager/deliverables/suggest_merge/",
    { body: { deliverable_ids: deliverableIds }, method: "POST", workspace },
  );
}

/**
 * Merge deliverables into one. **The source deliverables are deleted** and
 * their tasks are moved onto the new one.
 */
export async function mergeDeliverables(
  deliverableIds: string[],
  title: string,
  description: string,
  deliverableType: string | null,
  workspace: string,
): Promise<Deliverable> {
  return serverMutate<Deliverable>(
    "/apis/projectmanager/deliverables/merge/",
    {
      body: {
        deliverable_ids: deliverableIds,
        title,
        description,
        deliverable_type: deliverableType || undefined,
      },
      method: "POST",
      workspace,
    },
  );
}
