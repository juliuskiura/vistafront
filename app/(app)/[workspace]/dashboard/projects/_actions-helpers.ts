import { ServerFetchError } from "@/lib/api/server-fetch-types";

/**
 * Extract the human-readable message from a failed backend call.
 *
 * The projectmanager endpoints answer a few business rejections with a body
 * Django serialises as `{ detail }` or `{ error }` — "Tasks must belong to
 * same project", "AI suggestion failed".
 * Each of those carries the one sentence that tells the user what to do, so
 * it is shown verbatim rather than replaced with a generic apology.
 */
export function backendMessage(error: unknown, fallback: string): string {
  if (error instanceof ServerFetchError) {
    try {
      const parsed = JSON.parse(error.body) as {
        detail?: string;
        error?: string;
      };
      if (parsed.detail) return parsed.detail;
      if (parsed.error) return parsed.error;
    } catch {
      // Not JSON — fall through to the generic message.
    }
    if (error.status === 403) {
      return "Your role in this workspace does not allow that change.";
    }
  }
  return fallback;
}

/**
 * Read a string field out of a `FormData`.
 *
 * Everything the forms post arrives as a string; the empty string means
 * "not set", and the actions translate it to `null` where the backend wants
 * a cleared relation.
 */
export function pick(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/** The empty string means "not set" — the backend wants `null` there. */
export function orNull(value: string): string | null {
  return value ? value : null;
}
