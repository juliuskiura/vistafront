import { requireWorkspace } from "@/lib/auth/server";
import { SimpleChatClient } from "./simplechat-client";

/**
 * Simplechat (Server Component).
 *
 * Resolves the active workspace from the URL slug and renders the chat
 * widget. The widget opens a WebSocket handshake to `/ws/simplechat/rooms/`
 * and falls back to local state until that endpoint exists.
 */
export default async function SimpleChatPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  await requireWorkspace(slug);

  return <SimpleChatClient />;
}