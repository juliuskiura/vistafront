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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nanoid: string }> },
) {
  const { nanoid } = await params;

  try {
    const payload: unknown = await serverFetch(
      `/apis/livechat/rooms/${nanoid}/messages/`,
    );
    return NextResponse.json(unwrapMessages(payload));
  } catch {
    try {
      const payload: unknown = await serverFetch(
        `/apis/livechat/public/rooms/${nanoid}/messages/`,
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nanoid: string }> },
) {
  const { nanoid } = await params;

  const body = await request.json();

  try {
    const message = await serverMutate(`/apis/livechat/messages/`, {
      method: "POST",
      body: {
        chat_room: nanoid,
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