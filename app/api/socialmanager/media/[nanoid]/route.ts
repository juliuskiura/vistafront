import { cookies } from "next/headers";
import { serverFetch } from "@/lib/api/server-fetch";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const match = pathname.match(/\/api\/socialmanager\/media\/([^\/]+)/);
  const nanoid = match ? match[1] : "";
  const workspace = url.searchParams.get("workspace") ?? "";

  if (!nanoid || !workspace) {
    return new Response(
      JSON.stringify({ error: "Missing nanoid or workspace", pathname, nanoid, workspace }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const response = await serverFetch<ArrayBuffer>(
      `/apis/socialmanager/posts/${encodeURIComponent(nanoid)}/media/`,
      { workspace },
    );

    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
