import "server-only";

import { serverFetch, serverMutate, toQueryString } from "./server-fetch";
import type {
  CreateWorkspaceBody,
  DomainAvailability,
  Workspace,
  WorkspaceMember,
} from "./types";

/**
 * List the workspaces the signed-in user belongs to.
 *
 * Backed by `/apis/workspaces/workspaces/`. Returns `[]` on 200-with-empty.
 */
export async function listWorkspaces(): Promise<Workspace[]> {
  return serverFetch<Workspace[]>("/apis/workspaces/workspaces/");
}

/**
 * Fetch a single workspace by nanoid. Throws `ServerFetchError` on 404.
 */
export async function getWorkspace(nanoid: string): Promise<Workspace> {
  return serverFetch<Workspace>(`/apis/workspaces/workspaces/${nanoid}/`);
}

/**
 * Pre-flight domain availability check (used during onboarding).
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
 */
export async function createWorkspace(
  body: CreateWorkspaceBody,
): Promise<Workspace> {
  return serverMutate<Workspace>("/apis/workspaces/workspaces/", body, "POST");
}

/**
 * List members of a workspace.
 */
export async function listWorkspaceMembers(
  workspaceNanoid: string,
): Promise<WorkspaceMember[]> {
  return serverFetch<WorkspaceMember[]>(
    `/apis/workspaces/workspaces/${workspaceNanoid}/members/`,
  );
}
