import { serverFetch } from "@/lib/api/server-fetch";
import { serverMutate } from "@/lib/api/server-fetch";
import { NextResponse } from "next/server";

import {
  isRecoverableSessionExpiry,
  sessionExpiredResponse,
} from "@/lib/api/route-errors";

function unwrapRooms(payload: unknown): unknown[] {
  const rooms = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { results?: unknown })?.results)
      ? (payload as { results: unknown[] }).results
      : [];
  return rooms;
}

export async function GET() {
  try {
    const payload: unknown = await serverFetch(`/apis/livechat/rooms/`);
    return NextResponse.json(unwrapRooms(payload));
  } catch (error) {
    // The private endpoint needs a live token. An empty list is a legitimate
    // answer, so it must NOT be returned for a 401 — the client would treat
    // that as "no rooms" and never re-authenticate.
    if (await isRecoverableSessionExpiry(error)) {
      return sessionExpiredResponse([]);
    }
    return NextResponse.json([]);
  }
}

export async function POST() {
  try {
    const room = await serverMutate("/apis/livechat/rooms/", {
      method: "POST",
      body: {},
    });
    return NextResponse.json(room);
  } catch (error) {
    // Anonymous visitors can still open a room through the public endpoint, so
    // try it even when the private one failed. If both fail and the private
    // call failed on a 401, report the expiry so the client can recover.
    try {
      const room = await serverMutate("/apis/livechat/public/rooms/", {
        method: "POST",
        body: {},
      });
      return NextResponse.json(room);
    } catch (fallbackError) {
      if (await isRecoverableSessionExpiry(error, fallbackError)) {
        return sessionExpiredResponse({ error: "Session expired." });
      }
      return NextResponse.json(
        { error: "Failed to open a chat" },
        { status: 500 },
      );
    }
  }
}