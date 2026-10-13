import type { PostRecipient } from "@/lib/api/types";
import { waitForLiveTask } from "./live-task";

/**
 * A recipient whose copy is actually on a Page right now.
 *
 * `published` alone is not enough: a row can read as published from an earlier
 * attempt while `external_post_id` was never filled in, and there is nothing on
 * Meta to edit or delete in that case. Offering the buttons would queue a task
 * that can only come back refused.
 */
export function isLiveCopy(recipient: PostRecipient): boolean {
  return recipient.status === "published" && Boolean(recipient.external_post_id);
}

export { waitForLiveTask };
