"use server";

import { revalidatePath } from "next/cache";

import { createInvitation, revokeInvitation } from "@/lib/api";

export interface InviteActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialInviteState: InviteActionState = { status: "idle" };

/**
 * Server Action: send an invite from the workspace settings page.
 *
 * Called from the invite-member dialog. The form posts the active workspace
 * nanoid (hidden), the invitee's name + email, and the role. On success we
 * `revalidatePath` so the active invitations list refreshes without a full
 * reload.
 */
export async function sendInviteAction(
  _prev: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const workspace = String(formData.get("workspace") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "member").trim();
  const role = roleRaw === "admin" ? "admin" : "member";

  const fieldErrors: Record<string, string[]> = {};
  if (!workspace) {
    fieldErrors.workspace = ["Missing workspace. Refresh and try again."];
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = ["Enter a valid email address."];
  }
  if (!firstName) {
    fieldErrors.first_name = ["First name is required."];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    await createInvitation({
      workspace,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
    });
  } catch (error) {
    console.error("sendInviteAction failed:", error);
    return {
      status: "error",
      message:
        "We could not send the invitation. The address may already be invited, or the server may be unavailable.",
    };
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    message: `Invitation sent to ${email}.`,
  };
}

/**
 * Server Action: revoke a previously issued invitation.
 *
 * Used by the "Pending invitations" table on the workspace settings page.
 */
export async function revokeInviteAction(nanoid: string): Promise<void> {
  if (!nanoid) return;
  try {
    await revokeInvitation(nanoid);
  } catch (error) {
    console.error("revokeInviteAction failed:", error);
  }
  revalidatePath("/", "layout");
}