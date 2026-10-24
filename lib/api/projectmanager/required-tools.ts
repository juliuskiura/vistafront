import { serverFetch, serverMutate } from "../server-fetch";
import { toQueryString } from "../query-string";
import type {
  CreateRequiredToolBody,
  Paginated,
  RequiredTool,
  UpdateRequiredToolBody,
} from "../types";
import { unwrap } from "./shared";

/**
 * The required-tools endpoints.
 *
 * A required tool belongs to a task. Endpoints are tenant-scoped; the active
 * workspace slug is forwarded as the ``X-Workspace`` header on every call.
 */

export async function listRequiredTools(opts: {
  task?: string;
  workspace: string;
}): Promise<RequiredTool[]> {
  const { workspace, ...rest } = opts;
  const payload = await serverFetch<RequiredTool[] | Paginated<RequiredTool>>(
    `/apis/projectmanager/required-tools/${toQueryString(rest)}`,
    { workspace },
  );
  return unwrap(payload);
}

export function getRequiredTool(
  nanoid: string,
  workspace: string,
): Promise<RequiredTool> {
  return serverFetch<RequiredTool>(
    `/apis/projectmanager/required-tools/${nanoid}/`,
    { workspace },
  );
}

export async function createRequiredTool(
  body: CreateRequiredToolBody,
  workspace: string,
): Promise<RequiredTool> {
  return serverMutate<RequiredTool>("/apis/projectmanager/required-tools/", {
    body,
    method: "POST",
    workspace,
  });
}

export async function updateRequiredTool(
  nanoid: string,
  body: UpdateRequiredToolBody,
  workspace: string,
): Promise<RequiredTool> {
  return serverMutate<RequiredTool>(
    `/apis/projectmanager/required-tools/${nanoid}/`,
    { body, method: "PATCH", workspace },
  );
}

export async function deleteRequiredTool(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate(`/apis/projectmanager/required-tools/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}
