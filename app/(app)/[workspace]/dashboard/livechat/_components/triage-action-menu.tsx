"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EllipsisVertical,
  UserPlus,
  ArrowRightLeft,
  RotateCcw,
  Eye,
  LogOut,
} from "lucide-react";
import { useToast } from "@/lib/context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  assignAgent,
  closeRoom,
  reopenRoom,
  transferRoom,
  type ChatAgent,
  type ChatRoom,
} from "@/lib/api";
import type { RoomFeedRoom } from "../room-mappers";
import { mapChatRoomToFeed } from "../room-mappers";

interface TriageActionMenuProps {
  room: RoomFeedRoom;
  agents: ChatAgent[];
  workspaceDomain: string;
  onUpdate: (room: RoomFeedRoom) => void;
}

export function TriageActionMenu({
  room,
  agents,
  workspaceDomain,
  onUpdate,
}: TriageActionMenuProps) {
  const router = useRouter();
  const toast = useToast();
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const navigateToRoom = () => {
    router.push(`/${workspaceDomain}/dashboard/livechat/rooms/${room.nanoid}`);
  };

  const applyUpdate = (res: ChatRoom | null) => {
    if (res) onUpdate(mapChatRoomToFeed(res));
  };

  const handleAssign = async () => {
    try {
      const res = await assignAgent(room.nanoid, workspaceDomain, "all");
      applyUpdate(res);
      toast.push({ variant: "success", message: "Agent assigned to you." });
    } catch {
      toast.push({ variant: "error", message: "Failed to assign agent." });
    }
  };

  const handleReopen = async () => {
    try {
      const res = await reopenRoom(room.nanoid, workspaceDomain, "all");
      applyUpdate(res);
      toast.push({ variant: "success", message: "Room reopened." });
    } catch {
      toast.push({ variant: "error", message: "Failed to reopen room." });
    }
  };

  const handleTransfer = async (agentNanoid: string) => {
    try {
      const res = await transferRoom(room.nanoid, agentNanoid, workspaceDomain, "all");
      if (res?.room) onUpdate(mapChatRoomToFeed(res.room));
      toast.push({ variant: "success", message: "Room transferred." });
    } catch {
      toast.push({ variant: "error", message: "Failed to transfer room." });
    }
  };

  const handleClose = async () => {
    setCloseDialogOpen(false);
    try {
      const res = await closeRoom(room.nanoid, workspaceDomain, "all");
      applyUpdate(res);
      toast.push({ variant: "success", message: "Room closed." });
    } catch {
      toast.push({ variant: "error", message: "Failed to close room." });
    }
  };

  const hasAgent = !!room.agent_name;
  const availableAgents = agents.filter(
    (a) => a.is_available && a.user_name !== room.agent_name,
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-60 hover:opacity-100 focus:opacity-100"
            title="Triage actions"
          >
            <EllipsisVertical className="h-4 w-4" />
            <span className="sr-only">Triage actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Triage Actions</DropdownMenuLabel>

          <DropdownMenuItem onSelect={navigateToRoom}>
            <Eye className="h-4 w-4 mr-2" />
            View Room
          </DropdownMenuItem>

          {room.is_active ? (
            <>
              {!hasAgent && (
                <DropdownMenuItem onSelect={handleAssign}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign to Me
                </DropdownMenuItem>
              )}

              {hasAgent && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Transfer to</DropdownMenuLabel>
                  {availableAgents.length === 0 ? (
                    <DropdownMenuItem disabled>
                      <span className="text-muted-foreground">
                        No available agents
                      </span>
                    </DropdownMenuItem>
                  ) : (
                    availableAgents.map((agent) => (
                      <DropdownMenuItem
                        key={agent.nanoid}
                        onSelect={() => handleTransfer(agent.nanoid)}
                        className="pl-8"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        {agent.user_name}
                      </DropdownMenuItem>
                    ))
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleReopen}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reopen Room
              </DropdownMenuItem>
            </>
          )}

          {room.is_active && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setCloseDialogOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Close Room
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        title="Close room?"
        description="This will close the chat room. The customer can still reopen it by starting a new conversation."
        confirmLabel="Close Room"
        variant="destructive"
        onConfirm={handleClose}
      />
    </>
  );
}
