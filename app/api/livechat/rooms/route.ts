import { serverFetch } from "@/lib/api/server-fetch";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspace = searchParams.get("workspace") || "";

  try {
    const rooms = await serverFetch(`/apis/livechat/rooms/`, {
      workspace,
    });
    return NextResponse.json(rooms);
  } catch {
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}
