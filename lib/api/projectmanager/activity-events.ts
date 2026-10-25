import { serverFetch, serverMutate } from "../server-fetch";
import { toQueryString } from "../query-string";
import type {
  ActivityEvent,
  CreateActivityEventBody,
  Paginated,
} from "../types";
import { unwrap } from "./shared";

/**
 * The activity-events endpoints.
 *
 * An audit-log event recording a change to a project-manager record.
 * Endpoints are tenant-scoped; the active workspace slug is forwarded as the
 * ``X-Workspace`` header on every call.
 */

export async function listActivityEvents(opts: {
  target_type?: string;
  target_nanoid?: string;
  workspace: string;
}): Promise<ActivityEvent[]> {
  const { workspace, ...rest } = opts;
  const payload = await serverFetch<ActivityEvent[] | Paginated<ActivityEvent>>(
    `/apis/projectmanager/activity-events/${toQueryString(rest)}`,
    { workspace },
  );
  return unwrap(payload);
}

export function getActivityEvent(
  nanoid: string,
  workspace: string,
): Promise<ActivityEvent> {
  return serverFetch<ActivityEvent>(
    `/apis/projectmanager/activity-events/${nanoid}/`,
    { workspace },
  );
}

export async function createActivityEvent(
  body: CreateActivityEventBody,
  workspace: string,
): Promise<ActivityEvent> {
  return serverMutate<ActivityEvent>("/apis/projectmanager/activity-events/", {
    body,
    method: "POST",
    workspace,
  });
}
