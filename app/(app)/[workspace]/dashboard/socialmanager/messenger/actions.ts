"use server";

import { z, flattenError } from "zod";

import { reconnectPage } from "@/lib/api";
import type { ReconnectPageResult } from "@/lib/api/types";

/**
 * The contract for "register this page for messages".
 *
 * A page nanoid is the only payload, and it is still validated: it is a value
 * that arrived from a browser, and it is interpolated straight into a backend
 * path. `workspace` is a positional argument rather than part of the body so it
 * can never be spoofed out of the `X-Workspace` header by a crafted form.
 */
export const ResubscribeSchema = z.object({
  nanoid: z.string().min(1, "Missing page."),
  workspace: z.string().min(1, "Missing workspace."),
});

export type ResubscribeResult =
  | { status: "success"; probe: ReconnectPageResult }
  | { status: "error"; message: string; probe?: null };

/**
 * Ask Meta, once, whether a page can receive messages — and make it so if not.
 *
 * This deliberately does *not* call `revalidatePath`. The whole point of the
 * call is the answer it returns: `subscribed: true` proves the token is valid
 * and carries `pages_messaging` and that the page is now on the app's register.
 * Refetching the page list would discard that answer and leave the operator
 * staring at the same "Not checked" row they started with.
 *
 * The backend answers 400 with `{ok: false, reason}` when a page cannot be
 * repaired, so a platform-level refusal arrives as a fulfilled result carrying
 * the reason rather than as a thrown error. `error_type: "auth"` and `reauth`
 * both mean the same thing to this panel — only a browser re-auth fixes it.
 */
export async function resubscribePageAction(input: {
  nanoid: string;
  workspace: string;
}): Promise<ResubscribeResult> {
  const parsed = ResubscribeSchema.safeParse(input);
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: Object.values(fieldErrors).flat()[0] ?? "Invalid request.",
    };
  }

  const { nanoid, workspace } = parsed.data;

  try {
    return { status: "success", probe: await reconnectPage(nanoid, workspace) };
  } catch (error) {
    // Deliberately not the raw message: a 401 here means the *operator's* session
    // expired, which is not something a page's Messenger registration can fix,
    // and a Graph failure's wording is already carried by the probe result.
    return {
      status: "error",
      message:
        error instanceof Error && error.message
          ? error.message
          : "Could not reach the server.",
    };
  }
}
