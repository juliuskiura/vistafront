import { serverFetch, serverMutate } from "./server-fetch";
import type {
  Application,
  ApiKey,
  CreateApplicationBody,
  CreateKeyBody,
  KeyCreatedResult,
  Paginated,
} from "./types";

/**
 * Developer console API wrappers for applications and API keys.
 *
 * All calls are tenant-scoped: the `workspace` (domain) is forwarded as the
 * `X-Workspace` header so Django's `WorkspaceResolutionMiddleware` resolves
 * the correct tenant. Without it the backend answers `200 OK` with empty
 * results — silently doing nothing.
 */

/** List all applications for the workspace. */
export async function listApplications(workspace: string): Promise<Application[]> {
  const data = await serverFetch<Application[] | Paginated<Application>>(
    `/apis/developer/applications/`,
    { workspace },
  );
  if (Array.isArray(data)) {
    return data;
  }
  return data.results;
}

/** Create a new application. */
export async function createApplication(
  body: CreateApplicationBody,
  workspace: string,
): Promise<Application> {
  return serverMutate<Application>(`/apis/developer/applications/`, { workspace, body });
}

/** List all API keys for an application (metadata only, never the secret). */
export async function listKeys(
  applicationNanoid: string,
  workspace: string,
): Promise<ApiKey[]> {
  const data = await serverFetch<ApiKey[] | Paginated<ApiKey>>(
    `/apis/developer/applications/${applicationNanoid}/keys/`,
    { workspace },
  );
  if (Array.isArray(data)) {
    return data;
  }
  return data.results;
}

/** Generate a new API key for an application. Returns the plaintext once. */
export async function createKey(
  applicationNanoid: string,
  body: CreateKeyBody,
  workspace: string,
): Promise<KeyCreatedResult> {
  return serverMutate<KeyCreatedResult>(
    `/apis/developer/applications/${applicationNanoid}/keys/`,
    { workspace, body },
  );
}

/** Revoke (soft-delete) an API key by nanoid. */
export async function revokeKey(
  keyNanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>(`/apis/developer/keys/${keyNanoid}/`, {
    workspace,
    method: "DELETE",
    body: undefined,
  });
}
