import { getLivePostTaskStatusAction } from "../../actions";
import type { LivePostTaskResult } from "@/lib/api/types";

/** How long to wait between task polls, and when to give up.
 *
 *  Mirrors the comment-moderation poller: longer than a Graph round trip, short
 *  enough that a stalled button is noticed rather than lived with. */
const POLL_INTERVAL_MS = 1500;
const POLL_ATTEMPTS = 20;

/** Celery states that will never change again. Anything else keeps polling. */
const TERMINAL_STATUSES = new Set(["SUCCESS", "FAILURE", "REVOKED"]);

/**
 * How a live-post task ended.
 *
 * `ok: false` covers both a refusal from the platform and a task that never
 * settled — they look identical to the caller, which is the point: neither
 * changed anything the UI can claim.
 */
export type LiveTaskOutcome =
  | { ok: true; result: LivePostTaskResult; warnings: string[] }
  | { ok: false; failure: string; result: LivePostTaskResult | null };

function warningsOf(result: LivePostTaskResult): string[] {
  if (Array.isArray(result.warnings)) return result.warnings;
  return result.warning ? [result.warning] : [];
}

/**
 * Block until an edit/delete task settles, then hand back what it decided.
 *
 * The backend reaches Meta *before* it writes our row, so "the row has not
 * changed yet" is not evidence of failure — it is evidence the call is still in
 * flight. Polling is what makes the refresh afterwards mean something.
 *
 * A transient poll failure is not a task failure, so it is swallowed and retried
 * within the attempt budget. Only an exhausting budget, a Celery `FAILURE`, or
 * a `result.status === "failed"` payload resolves to `ok: false`.
 */
export async function waitForLiveTask(
  taskId: string,
  workspace: string,
): Promise<LiveTaskOutcome> {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    let payload: {
      status: string;
      result?: LivePostTaskResult | null;
    } | null = null;

    try {
      payload = await getLivePostTaskStatusAction(taskId, workspace);
    } catch {
      /* transient poll failure — try again until we run out of attempts */
    }

    if (payload) {
      const result = payload.result ?? null;
      const settled = TERMINAL_STATUSES.has(payload.status) || result !== null;
      if (settled) {
        const refused =
          payload.status === "FAILURE" || payload.status === "REVOKED" || result?.status === "failed";
        if (refused) {
          return {
            ok: false,
            failure:
              result?.error ??
              "The platform refused this change. Refresh to see the current state.",
            result,
          };
        }
        return {
          ok: true,
          result: result ?? { status: "success" },
          warnings: warningsOf(result ?? { status: "success" }),
        };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return {
    ok: false,
    failure: "Still processing on the platform. Refresh in a moment to see the result.",
    result: null,
  };
}
