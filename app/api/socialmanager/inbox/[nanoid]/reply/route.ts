import { NextResponse, type NextRequest } from "next/server";

import { replyToConversation } from "@/lib/api/inbox";
import { ServerFetchError } from "@/lib/api/server-fetch-types";
import {
  isRecoverableSessionExpiry,
  sessionExpiredResponse,
} from "@/lib/api/route-errors";

/**
 * Send a reply into an inbox thread.
 *
 * Error handling here is deliberately different from the other inbox handlers.
 * The backend's reply action reports every failure as `{"error": "..."}` with a
 * meaningful status — 400 blank or over-long text, 409 the Page is
 * disconnected, 502 the platform call failed. `apiErrorResponse` would
 * re-wrap that body under `detail` as an unparsed JSON *string*, which the
 * reply box cannot render. So the backend's own body and status are passed
 * through intact and the client reads `error` directly.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nanoid: string }> },
) {
  const { nanoid } = await params;
  const workspace = request.nextUrl.searchParams.get("workspace") ?? "";
  if (!workspace) {
    return NextResponse.json({ error: "Missing workspace" }, { status: 400 });
  }

  const text = await readText(request);

  try {
    const message = await replyToConversation(nanoid, text, workspace);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (await isRecoverableSessionExpiry(error)) {
      return sessionExpiredResponse({ error: "Session expired." });
    }
    if (error instanceof ServerFetchError) {
      return NextResponse.json(parseBackendError(error.body, error.message), {
        status: error.status,
      });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not send the message.",
      },
      { status: 502 },
    );
  }
}

async function readText(request: NextRequest): Promise<string> {
  try {
    const body: unknown = await request.json();
    const text = (body as { text?: unknown } | null)?.text;
    return typeof text === "string" ? text : "";
  } catch {
    return "";
  }
}

/**
 * Recover the backend's `{"error": "..."}` body from a raw response string,
 * falling back to the fetch-level message when the body is not the JSON we
 * expect (an HTML 500 page, an empty response, a proxy error).
 */
function parseBackendError(body: string, fallback: string): { error: string } {
  try {
    const parsed: unknown = JSON.parse(body);
    const error = (parsed as { error?: unknown } | null)?.error;
    if (typeof error === "string" && error) return { error };
    const detail = (parsed as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string" && detail) return { error: detail };
  } catch {
    // Not JSON — fall through.
  }
  return { error: fallback };
}
