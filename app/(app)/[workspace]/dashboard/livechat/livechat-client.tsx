"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/context";
import {
  Users,
  MessageSquare,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listWorkspaceMembers,
  listRooms,
  listAgents,
  createChatAgent,
  deleteChatAgent,
  closeRoom,
  assignAgent,
  transferRoom,
  type ChatRoom,
  type ChatAgent,
  type WorkspaceMember,
} from "@/lib/api";
import type { ActionResultLike } from "@/lib/api/server-fetch-types";

function useMutator() {
  const toast = useToast();
  const router = useRouter();

  return useCallback(
    async <T,>(action: Promise<T>, successMsg: string): Promise<boolean> => {
      let res: T | undefined;
      try {
        res = await action;
      } catch {
        toast.push({
          variant: "error",
          message: "Something went wrong on the server. Please try again.",
        });
        return false;
      }
      if (res && typeof res === "object" && "status" in res && (res as ActionResultLike).status !== "success") {
        toast.push({
          variant: "error",
          message: (res as ActionResultLike).message || "Something went wrong. Please try again.",
        });
        return false;
      }
      toast.push({ variant: "success", message: successMsg });
      try {
        router.refresh();
      } catch {
        // The mutation already committed server-side; a failed revalidation
        // only delays the refreshed props until the next navigation.
      }
      return true;
    },
    [toast, router],
  );
}

interface Props {
  workspaceDomain: string;
  workspaceNanoid: string;
  initialRooms: ChatRoom[];
  initialAgents: ChatAgent[];
  initialMembers: WorkspaceMember[];
}

export function LivechatClient({
  workspaceDomain,
  workspaceNanoid,
  initialRooms,
  initialAgents,
  initialMembers,
}: Props) {
  const router = useRouter();
  const mutate = useMutator();
  const [rooms, setRooms] = useState<ChatRoom[]>(initialRooms);
  const [agents, setAgents] = useState<ChatAgent[]>(initialAgents);
  const [members, setMembers] = useState<WorkspaceMember[]>(initialMembers);
  const [activeTab, setActiveTab] = useState<"rooms" | "agents">("rooms");

  const refreshData = useCallback(async () => {
    const [roomData, agentData, memberData] = await Promise.all([
      listRooms(workspaceDomain).catch(() => []),
      listAgents(workspaceDomain).catch(() => []),
      listWorkspaceMembers(workspaceNanoid, workspaceDomain).catch(() => []),
    ]);
    setRooms(roomData);
    setAgents(agentData);
    setMembers(memberData);
  }, [workspaceDomain, workspaceNanoid]);

  const handleCreateAgent = async (memberNanoid: string) => {
    const ok = await mutate(
      createChatAgent(memberNanoid, workspaceDomain),
      "Chat agent created.",
    );
    if (ok) {
      await refreshData();
      router.refresh();
    }
  };

  const handleCloseRoom = async (nanoid: string) => {
    const ok = await mutate(closeRoom(nanoid, workspaceDomain), "Room closed.");
    if (ok) {
      setRooms((prev) => prev.filter((r) => r.nanoid !== nanoid));
    }
  };

  const handleAssignAgent = async (roomNanoid: string, agentNanoid: string) => {
    const ok = await mutate(
      assignAgent(roomNanoid, workspaceDomain),
      "Agent assigned.",
    );
    if (ok) {
      router.refresh();
    }
  };

  const handleTransferRoom = async (
    roomNanoid: string,
    agentNanoid: string,
  ) => {
    const ok = await mutate(
      transferRoom(roomNanoid, agentNanoid, workspaceDomain),
      "Room transferred.",
    );
    if (ok) {
      router.refresh();
    }
  };

  const isAgent = (member: WorkspaceMember) =>
  agents.some((a) => a.user_name === `${member.first_name} ${member.last_name}`.trim());

  const handleRemoveAgent = async (member: WorkspaceMember) => {
    const agent = agents.find(
      (a) => a.user_name === `${member.first_name} ${member.last_name}`.trim(),
    );
    if (!agent) return;
    const ok = await mutate(
      deleteChatAgent(agent.nanoid, workspaceDomain),
      "Agent removed.",
    );
    if (ok) {
      await refreshData();
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Live Chat</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage chat rooms and agents for your workspace.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "rooms" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("rooms")}
        >
          <MessageSquare className="h-4 w-4 mr-1.5" />
          Rooms ({rooms.length})
        </Button>
        <Button
          variant={activeTab === "agents" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("agents")}
        >
          <Users className="h-4 w-4 mr-1.5" />
          Agents ({agents.length})
        </Button>
      </div>

      {activeTab === "rooms" && (
        <div className="rounded-xl border bg-card divide-y divide-slate-100">
          {rooms.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No active rooms yet.
            </div>
          )}
          {rooms.map((room) => (
            <div
              key={room.nanoid}
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    room.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {room.customer_name ?? "Customer"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {room.agent_name ?? "No agent assigned"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    room.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {room.is_active ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {room.is_active ? "Active" : "Closed"}
                </span>
                {room.is_active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleCloseRoom(room.nanoid)}
                    title="Close room"
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "agents" && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card divide-y divide-slate-100">
            {agents.map((agent) => (
              <div
                key={agent.nanoid}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      agent.is_available
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {agent.user_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {agent.current_room_nanoid
                        ? `In room: ${agent.current_room_nanoid}`
                        : "Available"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      agent.is_available
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {agent.is_available ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {agent.is_available ? "Available" : "Busy"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Workspace Members
            </h3>
            {members.length === 0 ? (
              <p className="text-xs text-slate-500">
                No workspace members found.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const memberIsAgent = isAgent(member);
                  return (
                    <div
                      key={member.nanoid}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                      {memberIsAgent ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => handleRemoveAgent(member)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Remove as Agent
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleCreateAgent(member.nanoid)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add as Agent
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
