import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/auth/server";
import { serverFetch } from "@/lib/api/server-fetch";
import { RoomConsole } from "./room-console";
import type { ChatRoom, ChatMessage, ChatAgent } from "@/lib/api/livechat";

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function withScope(path: string, scope?: "all") {
  return scope === "all" ? `${path}?scope=all` : path;
}

function unwrap<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && payload !== null && typeof payload === "object" && "results" in payload) {
    const results = (payload as Paginated<T>).results;
    return Array.isArray(results) ? results : [];
  }
  return [];
}

async function fetchMessages(nanoid: string, workspace: string, scope?: "all"): Promise<ChatMessage[]> {
  try {
    const data = await serverFetch<ChatMessage[] | Paginated<ChatMessage>>(
      withScope(`/apis/livechat/rooms/${nanoid}/messages/`, scope),
      { workspace }
    );
    return unwrap(data);
  } catch {
    return [];
  }
}

async function fetchRooms(workspace: string): Promise<ChatRoom[]> {
  try {
    const data = await serverFetch<ChatRoom[] | Paginated<ChatRoom>>(
      `/apis/livechat/rooms/`,
      { workspace }
    );
    return unwrap(data);
  } catch {
    return [];
  }
}

async function fetchAgents(workspace: string): Promise<ChatAgent[]> {
  try {
    const data = await serverFetch<ChatAgent[] | Paginated<ChatAgent>>(
      `/apis/livechat/agents/`,
      { workspace }
    );
    return unwrap(data);
  } catch {
    return [];
  }
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ workspace: string; nanoid: string }>;
}) {
  const { workspace: slug, nanoid } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [rooms, messages, agents] = await Promise.all([
    fetchRooms(ws),
    fetchMessages(nanoid, ws, "all"),
    fetchAgents(ws),
  ]);

  const room = rooms.find((r) => r.nanoid === nanoid);
  if (!room) notFound();

  return (
    <RoomConsole
      workspaceDomain={ws}
      room={room}
      initialMessages={messages}
      agents={agents}
    />
  );
}