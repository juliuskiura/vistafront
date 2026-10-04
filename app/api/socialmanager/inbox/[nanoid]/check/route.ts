import { NextResponse, type NextRequest } from "next/server";

import { checkReply } from "@/lib/api/inbox";
import { apiErrorResponse } from "@/lib/api/route-errors";

/**
 * Ask the platform's own rules what is wrong with a reply before sending it.
 *
 * A read in intent, a POST in transport: it takes the draft text in the body,
 * which a GET cannot, and it changes nothing. The composer calls it on a
 * debounce while the user types, so a hard limit shows up as something they can
 * fix rather than as a refusal after they hit send.
 *
 * Unlike the reply handler this never needs the backend's raw body passed
 * through: it answers 200 with `{ warnings, limits }` for every case the user
 * needs to see, including "no provider for this platform", so there is no
 * platform error string to forward and `apiErrorResponse` is the right shape.
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
    return NextResponse.json(await checkReply(nanoid, text, workspace));
  } catch (error) {
    // `apiErrorResponse` already turns a Django 401 into a 401 carrying
    // `X-Session-Expired`, which is what makes `useApiFetch` recover the session
    // instead of leaving the composer with a dead thread.
    return apiErrorResponse(error);
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