import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server-fetch";
import { apiErrorResponse } from "@/lib/api/route-errors";
import type { PaginatedAssets } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = `/apis/media/assets/?${searchParams.toString()}`;

  const workspace = request.headers.get("X-Workspace") ?? undefined;

  try {
    const data = await serverFetch<PaginatedAssets>(path, { workspace });
    return NextResponse.json(data);
  } catch (error) {
    return await apiErrorResponse(error, { message: "Internal server error" });
  }
}