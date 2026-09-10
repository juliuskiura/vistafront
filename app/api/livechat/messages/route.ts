import { serverFetch, serverMutate } from "@/lib/api/server-fetch";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomNanoid = searchParams.get("room");
  const workspace = searchParams.get("workspace") || "";

  if (!roomNanoid) {
    return NextResponse.json({ error: "room is required" }, { status: 400 });
  }

  try {
    const messages = await serverFetch(
      `/apis/livechat/rooms/${roomNanoid}/messages/`,
      { workspace },
    );
    return NextResponse.json(messages);
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomNanoid = searchParams.get("room");
  const workspace = searchParams.get("workspace") || "";

  if (!roomNanoid) {
    return NextResponse.json({ error: "room is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const message = await serverMutate(
      `/apis/livechat/rooms/${roomNanoid}/messages/`,
      {
        method: "POST",
        body: { content: body.content, reply_to: body.reply_to },
        workspace,
      },
    );
    return NextResponse.json(message);
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
