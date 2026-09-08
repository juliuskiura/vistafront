import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server-fetch";
import { ServerFetchError } from "@/lib/api/server-fetch-types";
import type { PaginatedAssets } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = `/apis/media/assets/?${searchParams.toString()}`;

  const workspace = request.headers.get("X-Workspace") ?? undefined;

  try {
    const data = await serverFetch<PaginatedAssets>(path, { workspace });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ServerFetchError) {
      return NextResponse.json(
        { detail: error.body || error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}