import "server-only";

import { serverFetch, serverMutate, toQueryString } from "./server-fetch";
import type {
  CreateWorkspaceBody,
  DomainAvailability,
  UpdateWorkspaceBody,
  Workspace,
  WorkspaceMember,
} from "./types";

/**
 * List the workspaces the signed-in user belongs to.
 *
 * Backed by `/apis/workspaces/workspaces/`. Returns `[]` on 200-with-empty.
 *
 * This endpoint is user-scoped (membership-based), not workspace-scoped, so
 * no ``X-Workspace`` header is sent.
 */
export async function listWorkspaces(): Promise<Workspace[]> {
  return serverFetch<Workspace[]>("/apis/workspaces/workspaces/");
}

/**
 * Fetch a single workspace by nanoid. Throws `ServerFetchError` on 404.
 *
 * User-scoped; no ``X-Workspace`` header.
 */
export async function getWorkspace(nanoid: string): Promise<Workspace> {
  return serverFetch<Workspace>(`/apis/workspaces/workspaces/${nanoid}/`);
}

/**
 * Pre-flight domain availability check (used during onboarding).
 *
 * Pre-tenant; no ``X-Workspace`` header.
 */
export async function checkDomainAvailability(
  domain: string,
): Promise<DomainAvailability> {
  return serverFetch<DomainAvailability>(
    `/apis/workspaces/workspaces/check_domain/${toQueryString({ domain })}`,
  );
}

/**
 * Create a workspace. The `client_business` field is the nanoid of an
 * existing `ClientBusiness` (created beforehand via the onboarding flow).
 *
 * Pre-tenant — there is no active workspace yet when this runs during
 * onboarding, so no ``X-Workspace`` header is sent.
 */
export async function createWorkspace(
  body: CreateWorkspaceBody,
): Promise<Workspace> {
  return serverMutate<Workspace>("/apis/workspaces/workspaces/", {
    body,
    method: "POST",
  });
}

/**
 * List members of a workspace.
 *
 * Tenant-scoped — pass the active workspace slug so the backend can
 * resolve the tenant context. The ``workspaceNanoid`` path segment is the
 * workspace whose members to list; both can be the same workspace.
 */
export async function listWorkspaceMembers(
  workspaceNanoid: string,
  workspace: string,
): Promise<WorkspaceMember[]> {
  return serverFetch<WorkspaceMember[]>(
    `/apis/workspaces/workspaces/${workspaceNanoid}/members/`,
    { workspace },
  );
}

/**
 * Patch a workspace's mutable fields (name, domain). Returns the updated
 * `Workspace`. Domain changes go through the same availability rules as
 * creation; the backend will reject duplicates.
 *
 * Tenant-scoped — pass the active workspace slug.
 */
export async function updateWorkspace(
  nanoid: string,
  patch: UpdateWorkspaceBody,
  workspace: string,
): Promise<Workspace> {
  return serverMutate<Workspace>(
    `/apis/workspaces/workspaces/${nanoid}/`,
    { body: patch, method: "PATCH", workspace },
  );
}

/**
 * Have the signed-in user leave the workspace. The workspace itself is
 * not deleted — only the membership row. Returns the backend's `204`.
 *
 * Tenant-scoped — pass the active workspace slug.
 */
export async function leaveWorkspace(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>(
    `/apis/workspaces/workspaces/${nanoid}/leave/`,
    { body: {}, method: "POST", workspace },
  );
}
