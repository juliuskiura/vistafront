"use server";

import { serverFetch, serverMutate } from "./server-fetch";
import type { Paginated } from "./types";

const BASE = "/apis/livechat";

function unwrap<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as Paginated<T>).results)) {
    return (payload as Paginated<T>).results;
  }
  return [];
}

export interface ChatRoom {
  nanoid: string;
  is_active: boolean;
  customer_id: number | null;
  agent_id: number | null;
  agent_name: string | null;
  customer_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  nanoid: string;
  content: string;
  sender_id: number | null;
  sender_name: string | null;
  reply_to_nanoid: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface ChatAgent {
  nanoid: string;
  is_available: boolean;
  current_room_nanoid: string | null;
  user_name: string;
}

function withScope(path: string, scope?: "all") {
  return scope === "all" ? `${path}?scope=all` : path;
}

export async function listRooms(workspace: string, scope?: "all") {
  return serverFetch<ChatRoom[] | Paginated<ChatRoom>>(
    withScope(`${BASE}/rooms/`, scope),
    { workspace },
  ).then(unwrap);
}

export async function getRoom(nanoid: string, workspace: string) {
  return serverFetch<ChatRoom>(`${BASE}/rooms/${nanoid}/`, { workspace });
}

export async function createRoom(workspace: string) {
  return serverMutate<ChatRoom>(`${BASE}/rooms/`, {
    method: "POST",
    body: {},
    workspace,
  });
}

export async function assignAgent(
  nanoid: string,
  workspace: string,
  scope?: "all",
) {
  return serverMutate<ChatRoom>(withScope(`${BASE}/rooms/${nanoid}/assign_agent/`, scope), {
    method: "POST",
    body: {},
    workspace,
  });
}

export async function closeRoom(
  nanoid: string,
  workspace: string,
  scope?: "all",
) {
  return serverMutate<ChatRoom>(withScope(`${BASE}/rooms/${nanoid}/close/`, scope), {
    method: "POST",
    body: {},
    workspace,
  });
}

export async function reopenRoom(
  nanoid: string,
  workspace: string,
  scope?: "all",
) {
  return serverMutate<ChatRoom>(withScope(`${BASE}/rooms/${nanoid}/reopen/`, scope), {
    method: "POST",
    body: {},
    workspace,
  });
}

export async function transferRoom(
  nanoid: string,
  agentNanoid: string,
  workspace: string,
  scope?: "all",
) {
  return serverMutate<{ room: ChatRoom; notifications: Record<string, string> }>(
    withScope(`${BASE}/rooms/${nanoid}/transfer/`, scope),
    {
      method: "POST",
      body: { agent_nanoid: agentNanoid },
      workspace,
    },
  );
}

export async function getMessages(
  nanoid: string,
  workspace: string,
  scope?: "all",
) {
  return serverFetch<ChatMessage[] | Paginated<ChatMessage>>(
    withScope(`${BASE}/rooms/${nanoid}/messages/`, scope),
    { workspace },
  ).then(unwrap);
}

export async function sendMessage(
  nanoid: string,
  content: string,
  replyToNanoid?: string,
  workspace?: string,
) {
  const body: Record<string, unknown> = { content };
  if (replyToNanoid) body.reply_to = replyToNanoid;
  return serverMutate<ChatMessage>(`${BASE}/rooms/${nanoid}/messages/`, {
    method: "POST",
    body,
    workspace,
  });
}

export async function markRead(
  nanoid: string,
  messageNanoid: string,
  workspace: string,
) {
  return serverMutate<{ status: string }>(
    `${BASE}/messages/${messageNanoid}/mark_read/`,
    {
      method: "POST",
      body: {},
      workspace,
    },
  );
}

export async function getUnreadCount(nanoid: string, workspace: string) {
  return serverFetch<{ unread_count: number }>(
    `${BASE}/rooms/${nanoid}/unread/`,
    { workspace },
  );
}

export async function listAgents(workspace: string) {
  return serverFetch<ChatAgent[] | Paginated<ChatAgent>>(`${BASE}/agents/`, {
    workspace,
  }).then(unwrap);
}

export async function getAgent(nanoid: string, workspace: string) {
  return serverFetch<ChatAgent>(`${BASE}/agents/${nanoid}/`, { workspace });
}

export async function createChatAgent(
  userNanoid: string,
  workspace: string,
) {
  return serverMutate<ChatAgent>(`${BASE}/agents/`, {
    method: "POST",
    body: { user: userNanoid },
    workspace,
  });
}

export async function deleteChatAgent(
  nanoid: string,
  workspace: string,
) {
  return serverMutate<ChatAgent>(`${BASE}/agents/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}
