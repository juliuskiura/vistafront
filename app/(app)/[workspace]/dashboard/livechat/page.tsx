import { requireWorkspace } from "@/lib/auth/server";
import { listRooms, listAgents, listWorkspaceMembers } from "@/lib/api";
import { LivechatClient } from "./livechat-client";

export default async function LivechatPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [rooms, agents, members] = await Promise.all([
    listRooms(ws).catch(() => []),
    listAgents(ws).catch(() => []),
    listWorkspaceMembers(active.nanoid, ws).catch(() => []),
  ]);

  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeAgents = Array.isArray(agents) ? agents : [];
  const safeMembers = Array.isArray(members) ? members : [];

  return (
    <LivechatClient
      workspaceDomain={ws}
      workspaceNanoid={active.nanoid}
      initialRooms={safeRooms}
      initialAgents={safeAgents}
      initialMembers={safeMembers}
    />
  );
}
