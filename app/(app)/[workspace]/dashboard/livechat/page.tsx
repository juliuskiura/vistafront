import { requireWorkspace } from "@/lib/auth/server";
import { listRooms } from "@/lib/api";
import { ChatPageClient } from "./chat-page-client";

export default async function LivechatPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const rooms = await listRooms(ws).catch(() => []);

  return <ChatPageClient rooms={rooms} workspaceDomain={ws} />;
}
