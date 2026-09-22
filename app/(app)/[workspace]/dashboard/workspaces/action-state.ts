/**
 * Shared form-action state used by the workspace invite dialog.
 *
 * Kept OUT of `actions.ts` (a `"use server"` module) because "use server"
 * files may only export async functions — a plain object like
 * `initialInviteState` is not allowed there.
 */

export interface InviteActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialInviteState: InviteActionState = { status: "idle" };