"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/context";
import {
  Users,
  CheckCircle2,
  Clock,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAgents } from "@/lib/api";
import type { ChatAgent } from "@/lib/api";

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
      if (
        res &&
        typeof res === "object" &&
        "status" in res &&
        (res as { status?: string }).status !== "success"
      ) {
        toast.push({
          variant: "error",
          message:
            (res as { message?: string }).message ||
            "Something went wrong. Please try again.",
        });
        return false;
      }
      toast.push({ variant: "success", message: successMsg });
      try {
        router.refresh();
      } catch {
        // The mutation already committed server-side.
      }
      return true;
    },
    [toast, router],
  );
}

interface Props {
  workspaceDomain: string;
  initialAgents: ChatAgent[];
}

export function LivechatAgentsClient({
  workspaceDomain,
  initialAgents,
}: Props) {
  const [agents, setAgents] = useState<ChatAgent[]>(initialAgents);
  const mutate = useMutator();

  const handleSetAvailable = async (
    agentNanoid: string,
    isAvailable: boolean,
  ) => {
    const ok = await mutate(
      fetch(
        `/api/livechat/agents/${agentNanoid}/set_available`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_available: isAvailable }),
        },
      ).then((r) => r.json()),
      isAvailable ? "Agent set to available." : "Agent set to busy.",
    );
    if (ok) {
      setAgents((prev) =>
        prev.map((a) =>
          a.nanoid === agentNanoid
            ? { ...a, is_available: isAvailable }
            : a,
        ),
      );
    }
  };

  const availableCount = agents.filter((a) => a.is_available).length;
  const busyCount = agents.filter((a) => !a.is_available).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Agents</h2>
          <p className="text-sm text-slate-500 mt-1">
            {availableCount} available · {busyCount} busy
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card divide-y divide-slate-100">
        {agents.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No agents yet. Create one from the Members tab.
          </div>
        )}
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
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() =>
                  handleSetAvailable(
                    agent.nanoid,
                    !agent.is_available,
                  )
                }
                title={
                  agent.is_available ? "Set busy" : "Set available"
                }
              >
                {agent.is_available ? (
                  <LogOut className="h-4 w-4 text-orange-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
