import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { serverFetch } from "@/lib/api/server-fetch";
import { apiErrorResponse } from "@/lib/api/route-errors";
import type { Attachment } from "@/lib/api/types";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/**
 * Stream an attachment's bytes to the browser.
 *
 * Django stores the file on its own media root and hands out a URL
 * pointing at *its* host — which the browser usually cannot reach. This
 * route fetches the file server-side, with the session cookie, and passes
 * the bytes through, so a download behaves like any other link in the app.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nanoid: string }> },
) {
  const { nanoid } = await params;
  const workspace = request.nextUrl.searchParams.get("workspace") ?? undefined;

  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access");
    const refresh = cookieStore.get("refresh");
    const cookieHeader = [
      access ? `access=${access.value}` : null,
      refresh ? `refresh=${refresh.value}` : null,
    ]
      .filter(Boolean)
      .join("; ");

    const headers: HeadersInit = {};
    if (cookieHeader) headers.Cookie = cookieHeader;

    const attachment = await serverFetch<Attachment>(
      `/apis/attachments/${nanoid}/`,
      { workspace },
    );

    const fileUrl = /^https?:\/\//i.test(attachment.file)
      ? attachment.file
      : `${BACKEND_URL}/${attachment.file.replace(/^\/+/, "")}`;

    const fileResponse = await fetch(fileUrl, {
      headers,
      cache: "no-store",
    });

    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "The stored file could not be read." },
        { status: 502 },
      );
    }

    return new NextResponse(fileResponse.body, {
      headers: {
        "Content-Type":
          fileResponse.headers.get("content-type") ??
          "application/octet-stream",
        "Content-Length":
          fileResponse.headers.get("content-length") ?? "",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          attachment.original_name,
        )}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return await apiErrorResponse(error, {
      message: "Failed to download the file.",
      status: 502,
    });
  }
}
