import { serverFetch } from "@/lib/api/server-fetch";
import { serverMutate } from "@/lib/api/server-fetch";
import { NextRequest, NextResponse } from "next/server";

function unwrapMessages(payload: unknown): unknown[] {
  const messages = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { results?: unknown })?.results)
      ? (payload as { results: unknown[] }).results
      : [];
  return messages;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomNanoid = searchParams.get("room");

  if (!roomNanoid) {
    return NextResponse.json({ error: "room is required" }, { status: 400 });
  }

  try {
    const payload: unknown = await serverFetch(
      `/apis/livechat/rooms/${roomNanoid}/messages/`,
    );
    return NextResponse.json(unwrapMessages(payload));
  } catch {
    try {
      const payload: unknown = await serverFetch(
        `/apis/livechat/public/rooms/${roomNanoid}/messages/`,
      );
      return NextResponse.json(unwrapMessages(payload));
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 },
      );
    }
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomNanoid = searchParams.get("room");

  if (!roomNanoid) {
    return NextResponse.json({ error: "room is required" }, { status: 400 });
  }

  const body = await request.json();

  try {
    const message = await serverMutate(`/apis/livechat/messages/`, {
      method: "POST",
      body: {
        chat_room: roomNanoid,
        content: body.content,
        reply_to: body.reply_to,
      },
    });
    return NextResponse.json(message);
  } catch {
    try {
      const message = await serverMutate(`/apis/livechat/public/messages/`, {
        method: "POST",
        body: {
          chat_room: roomNanoid,
          content: body.content,
          reply_to: body.reply_to,
        },
      });
      return NextResponse.json(message);
    } catch {
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }
  }
}