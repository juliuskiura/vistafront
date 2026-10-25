import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
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
    if (workspace) headers["X-Workspace"] = workspace;

    const backendResponse = await fetch(
      `${BACKEND_URL}/apis/crm/companies/import_template/`,
      { headers, cache: "no-store" },
    );

    if (!backendResponse.ok) {
      const text = await backendResponse.text();
      return NextResponse.json(
        { error: `Template download failed: ${backendResponse.status} ${text}` },
        { status: backendResponse.status },
      );
    }

    return new NextResponse(backendResponse.body, {
      headers: {
        "Content-Type":
          backendResponse.headers.get("content-type") ??
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          backendResponse.headers.get("content-disposition") ??
          'attachment; filename="companies-import-template.xlsx"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("import_template proxy failed:", error);
    return NextResponse.json(
      { error: "Failed to download the template." },
      { status: 502 },
    );
  }
}
