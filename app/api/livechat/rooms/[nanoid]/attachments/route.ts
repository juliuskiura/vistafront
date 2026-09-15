import { serverMutateFormData } from "@/lib/media/server-mutate-formdata";
import { serverFetch } from "@/lib/api/server-fetch";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nanoid: string }> },
) {
  const { nanoid } = await params;
  try {
    const attachments = await serverFetch(
      `/apis/livechat/attachments/by-room/${nanoid}/`,
    );
    return NextResponse.json(attachments);
  } catch {
    return NextResponse.json({ error: "Failed to fetch images." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nanoid: string }> },
) {
  const { nanoid } = await params;
  const incoming = await request.formData();
  const file = incoming.get("file");

  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files can be attached." },
      { status: 400 },
    );
  }

  const formData = new FormData();
  formData.append("room", nanoid);
  formData.append("file", file, file.name);
  formData.append("file_name", file.name);
  formData.append("file_size", String(file.size));
  formData.append("file_type", file.type);

  try {
    const attachment = await serverMutateFormData(
      "/apis/livechat/attachments/",
      formData,
      { workspace: request.headers.get("x-workspace") ?? undefined },
    );
    return NextResponse.json(attachment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 },
    );
  }
}
