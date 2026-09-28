import { serverFetch } from "@/lib/api/server-fetch";
import { NextResponse } from "next/server";

import {
  isRecoverableSessionExpiry,
  sessionExpiredResponse,
} from "@/lib/api/route-errors";

export async function GET() {
  try {
    const room = await serverFetch("/apis/livechat/rooms/active-room/");
    return NextResponse.json(room);
  } catch (error) {
    // `null` means "no active room" to the chat widget. A 401 must not be
    // flattened into that, or the widget sits there forever with no room and
    // no reason to re-authenticate.
    if (await isRecoverableSessionExpiry(error)) {
      return sessionExpiredResponse(null);
    }
    return NextResponse.json(null);
  }
}
