/**
 * Shared form-action state used by the mailbox forms.
 *
 * Kept OUT of `actions.ts` (a `"use server"` module) because a "use server"
 * file may only export async functions — a plain object like `IDLE` is not
 * allowed there. Mirrors `dashboard/workspaces/action-state.ts`.
 */

export interface MailboxActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const IDLE: MailboxActionState = { status: "idle" };
