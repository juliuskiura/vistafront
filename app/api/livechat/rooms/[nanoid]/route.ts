import { serverMutate } from "@/lib/api/server-fetch";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ nanoid: string }> },
) {
  const { nanoid } = await params;
  try {
    const room = await serverMutate(
      `/apis/livechat/rooms/${nanoid}/close/`,
      { method: "POST", body: {} },
    );
    return NextResponse.json(room);
  } catch {
    return NextResponse.json(
      { error: "Failed to close chat" },
      { status: 500 },
    );
  }
}
