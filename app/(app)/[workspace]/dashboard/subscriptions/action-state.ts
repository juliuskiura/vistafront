/**
 * Shared form-action state used by the subscriptions console.
 *
 * Kept OUT of `actions.ts` (a `"use server"` module) because "use server"
 * files may only export async functions — a plain object like
 * `initialActionState` is not allowed there.
 */

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialActionState: ActionState = { status: "idle" };