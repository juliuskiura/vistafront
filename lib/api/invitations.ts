import "server-only";

import { serverFetch, serverMutate } from "./server-fetch";
import type {
  CreateInvitationBody,
  Invitation,
  RedeemInvitationBody,
  RedeemInvitationResult,
} from "./types";

export async function listInvitations(): Promise<Invitation[]> {
  return serverFetch<Invitation[]>("/apis/workspaces/invitations/");
}

export async function createInvitation(
  body: CreateInvitationBody,
): Promise<Invitation> {
  return serverMutate<Invitation>(
    "/apis/workspaces/invitations/",
    body,
    "POST",
  );
}

export async function revokeInvitation(nanoid: string): Promise<Invitation> {
  return serverMutate<Invitation>(
    `/apis/workspaces/invitations/${nanoid}/revoke/`,
    {},
    "POST",
  );
}

export async function redeemInvitation(
  body: RedeemInvitationBody,
): Promise<RedeemInvitationResult> {
  return serverMutate<RedeemInvitationResult>(
    "/apis/workspaces/invitations/redeem/",
    body,
    "POST",
  );
}
