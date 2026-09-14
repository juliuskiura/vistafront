"use client";

import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ChatAgent } from "@/lib/api/livechat";
import type { RoomFeedRoom } from "./rooms-feed";
import { PriorityBadge } from "./_components/priority-badge";
import { StatusBadge } from "./_components/status-badge";
import { SubjectQueryCell } from "./_components/subject-query-cell";
import { TriageActionMenu } from "./_components/triage-action-menu";

interface RoomsTableProps {
  rooms: RoomFeedRoom[];
  agents: ChatAgent[];
  workspaceDomain: string;
  onUpdateRoom: (room: RoomFeedRoom) => void;
}

const columnHelper = createColumnHelper<RoomFeedRoom>();

export function RoomsTable({ rooms, agents, workspaceDomain, onUpdateRoom }: RoomsTableProps) {
  const router = useRouter();

  const columns = [
    columnHelper.display({
      id: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const room = row.original;
        const lastMsg = room.last_message;
        const derivedName =
          lastMsg?.sender_name &&
          lastMsg.sender_name !== "You" &&
          lastMsg.sender_name !== room.agent_name
            ? lastMsg.sender_name
            : null;
        const displayName = room.customer_name ?? derivedName ?? "Customer";
        return (
          <button
            onClick={() =>
              router.push(`/${workspaceDomain}/dashboard/livechat/rooms/${room.nanoid}`)
            }
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="font-medium text-slate-900">{displayName}</span>
          </button>
        );
      },
    }),
    columnHelper.display({
      id: "agent",
      header: "Agent",
      cell: ({ row }) => {
        const agentName = row.original.agent_name;
        return (
          <span className="text-sm text-slate-700">
            {agentName ?? (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "subject-query",
      header: "Subject & Query",
      cell: ({ row }) => <SubjectQueryCell room={row.original} />,
    }),
    columnHelper.accessor("unread_count", {
      id: "priority",
      header: "Priority Level",
      cell: ({ getValue }) => <PriorityBadge unreadCount={getValue() ?? 0} />,
    }),
    columnHelper.accessor("is_active", {
      id: "status",
      header: "Status",
      cell: ({ getValue }) => <StatusBadge isActive={getValue()} />,
    }),
    columnHelper.display({
      id: "triage",
      header: "Triage Action",
      cell: ({ row }) => (
        <TriageActionMenu
          room={row.original}
          agents={agents}
          workspaceDomain={workspaceDomain}
          onUpdate={onUpdateRoom}
        />
      ),
    }),
  ];

  const table = useReactTable({
    data: rooms,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
    debugTable: false,
  });

  const visibleColumns = table.getVisibleLeafColumns();

  return (
    <Card className="overflow-hidden border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b bg-muted/50 text-left"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No rooms yet. Rooms appear here when a customer starts a chat.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={
                        cell.column.id === "customer"
                          ? "cursor-pointer px-4 py-3"
                          : "px-4 py-3 align-top"
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
