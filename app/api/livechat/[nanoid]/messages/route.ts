import { serverFetch } from "@/lib/api/server-fetch";
import { serverMutate } from "@/lib/api/server-fetch";
import { NextRequest, NextResponse } from "next/server";

import {
  apiErrorResponse,
  isRecoverableSessionExpiry,
  sessionExpiredResponse,
} from "@/lib/api/route-errors";

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
  } catch (error) {
    // The public endpoint is anonymous, so an expired session does not stop us
    // reading history — only report the expiry if the fallback failed too.
    try {
      const payload: unknown = await serverFetch(
        `/apis/livechat/public/rooms/${nanoid}/messages/`,
      );
      return NextResponse.json(unwrapMessages(payload));
    } catch (fallbackError) {
      if (await isRecoverableSessionExpiry(error, fallbackError)) {
        return sessionExpiredResponse({ error: "Session expired." });
      }
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
  } catch (error) {
    return await apiErrorResponse(error, {
      message: "Failed to send message",
      status: 500,
    });
  }
}