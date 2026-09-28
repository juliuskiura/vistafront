import { serverMutate } from "@/lib/api/server-fetch";
import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/route-errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ nanoid: string }> },
) {
  const { nanoid } = await params;
  try {
    const room = await serverMutate(
      `/apis/livechat/rooms/${nanoid}/reopen/`,
      { method: "POST", body: {} },
    );
    return NextResponse.json(room);
  } catch (error) {
    return await apiErrorResponse(error, { message: "Failed to reopen chat", status: 500 });
  }
}
