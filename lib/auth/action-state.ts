/**
 * Shape of every Server Action return value in the auth flow.
 *
 * The action never returns a full `User` payload (the cookie session is the
 * source of truth). It only tells the form whether to show an error, send
 * the user to verify-email, or hand off to the app.
 */
export type AuthActionState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; redirectTo: string };

export const initialAuthState: AuthActionState = { status: "idle" };
