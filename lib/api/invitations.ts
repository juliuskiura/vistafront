import { serverFetch, serverMutate } from "./server-fetch";
import type {
  CreateInvitationBody,
  Invitation,
  RedeemInvitationBody,
  RedeemInvitationResult,
} from "./types";

/**
 * List invitations issued in the active workspace. Tenant-scoped — pass
 * ``workspace`` (the active workspace slug from ``requireWorkspace``).
 */
export async function listInvitations(workspace: string): Promise<Invitation[]> {
  return serverFetch<Invitation[]>("/apis/workspaces/invitations/", { workspace });
}

/**
 * Create an invitation in the active workspace. Tenant-scoped.
 */
export async function createInvitation(
  body: CreateInvitationBody,
  workspace: string,
): Promise<Invitation> {
  return serverMutate<Invitation>("/apis/workspaces/invitations/", {
    body,
    method: "POST",
    workspace,
  });
}

/**
 * Revoke a previously-issued invitation. Tenant-scoped.
 */
export async function revokeInvitation(
  nanoid: string,
  workspace: string,
): Promise<Invitation> {
  return serverMutate<Invitation>(
    `/apis/workspaces/invitations/${nanoid}/revoke/`,
    { body: {}, method: "POST", workspace },
  );
}

/**
 * Redeem an invitation code. Pre-tenant — the caller doesn't yet belong
 * to the workspace, so no ``X-Workspace`` header is sent.
 */
export async function redeemInvitation(
  body: RedeemInvitationBody,
): Promise<RedeemInvitationResult> {
  return serverMutate<RedeemInvitationResult>(
    "/apis/workspaces/invitations/redeem/",
    { body, method: "POST" },
  );
}
