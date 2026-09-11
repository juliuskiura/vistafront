import { serverFetch } from "@/lib/api/server-fetch";
import { serverMutate } from "@/lib/api/server-fetch";
import { NextResponse } from "next/server";

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
  } catch {
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
  } catch {
    try {
      const room = await serverMutate("/apis/livechat/public/rooms/", {
        method: "POST",
        body: {},
      });
      return NextResponse.json(room);
    } catch {
      return NextResponse.json(
        { error: "Failed to open a chat" },
        { status: 500 },
      );
    }
  }
}