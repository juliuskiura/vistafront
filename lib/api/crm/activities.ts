import { serverFetch, serverMutate } from "../server-fetch";
import type { ActionType, Activity } from "../types";
import { fetchList, qs, wsOpts } from "./shared";

/**
 * List activities.
 *
 * `?company=` and `?contact=` are the only filters the backend supports.
 * The list serializer omits `company_name` and `updated_at`.
 */
export async function listActivities(opts: {
  company?: string;
  contact?: string;
  workspace: string;
}): Promise<Activity[]> {
  return fetchList<Activity>(
    `/apis/crm/activities/${qs({
      company: opts.company,
      contact: opts.contact,
    })}`,
    opts.workspace,
  );
}

export interface CreateActivityBody {
  /** Company nanoid — required. */
  company: string;
  /** Action-type nanoid — required. */
  action_type: string;
  subject: string;
  /** Optional contact nanoid. */
  contact?: string | null;
  due_at?: string | null;
  completed_at?: string | null;
  /**
   * The free-text body of the activity.
   *
   * There is no `description` on the serializer — the model has the column
   * but nothing exposes it — so the body lives in the `content` JSON blob.
   * The UI stores `{ text: "…" }`.
   */
  content?: Record<string, unknown>;
}

export function createActivity(
  body: CreateActivityBody,
  workspace: string,
): Promise<Activity> {
  return serverMutate<Activity>("/apis/crm/activities/", {
    body,
    workspace,
  });
}

export function updateActivity(
  nanoid: string,
  body: Partial<CreateActivityBody>,
  workspace: string,
): Promise<Activity> {
  return serverMutate<Activity>(`/apis/crm/activities/${nanoid}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}

export function deleteActivity(
  nanoid: string,
  workspace: string,
): Promise<void> {
  return serverMutate<void>(`/apis/crm/activities/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

/** The kinds of work an activity can represent (call, email, meeting, …). */
export async function listActionTypes(workspace: string): Promise<ActionType[]> {
  return fetchList<ActionType>("/apis/crm/action-types/", workspace);
}

/** Fetch a single action type — used to resolve a name in a list response. */
export function getActionType(
  nanoid: string,
  workspace: string,
): Promise<ActionType> {
  return serverFetch<ActionType>(
    `/apis/crm/action-types/${nanoid}/`,
    wsOpts(workspace),
  );
}
