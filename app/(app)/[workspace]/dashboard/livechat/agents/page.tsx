import { requireWorkspace } from "@/lib/auth/server";
import { listAgents } from "@/lib/api";
import { LivechatAgentsClient } from "./livechat-agents-client";

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const agents = await listAgents(active.domain).catch(() => []);
  const safeAgents = Array.isArray(agents) ? agents : [];

  return <LivechatAgentsClient workspaceDomain={active.domain} initialAgents={safeAgents} />;
}
