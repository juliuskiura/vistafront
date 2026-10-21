import { ServerFetchError } from "@/lib/api/server-fetch-types";

/**
 * Extract the human-readable message from a failed backend call.
 *
 * The backend answers a few business rejections with a body Django
 * serialises as `{ detail }` (the company delete conflict) or `{ error }`
 * (the deal move validation). Both carry a message the user needs to read
 * verbatim — a generic "something went wrong" would hide the one sentence
 * that tells them what to do.
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
    if (error.status === 409) {
      return "This company is still referenced by other records. Delink or delete those records first.";
    }
  }
  return fallback;
}
