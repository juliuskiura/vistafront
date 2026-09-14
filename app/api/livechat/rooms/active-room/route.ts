import { serverFetch } from "@/lib/api/server-fetch";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const room = await serverFetch("/apis/livechat/rooms/active-room/");
    return NextResponse.json(room);
  } catch {
    return NextResponse.json(null);
  }
}
