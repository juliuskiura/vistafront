"use server";

import { serverFetch, serverMutate } from "./server-fetch";
import type { RequestOptions, MutateOptions } from "./server-fetch-types";

const BASE = "/apis/livechat";

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

export async function listRooms(workspace: string) {
  return serverFetch<ChatRoom[]>(`${BASE}/rooms/`, { workspace });
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

export async function assignAgent(nanoid: string, workspace: string) {
  return serverMutate<ChatRoom>(`${BASE}/rooms/${nanoid}/assign_agent/`, {
    method: "POST",
    body: {},
    workspace,
  });
}

export async function closeRoom(nanoid: string, workspace: string) {
  return serverMutate<ChatRoom>(`${BASE}/rooms/${nanoid}/close/`, {
    method: "POST",
    body: {},
    workspace,
  });
}

export async function transferRoom(
  nanoid: string,
  agentNanoid: string,
  workspace: string,
) {
  return serverMutate<{ room: ChatRoom; notifications: Record<string, string> }>(
    `${BASE}/rooms/${nanoid}/transfer/`,
    {
      method: "POST",
      body: { agent_nanoid: agentNanoid },
      workspace,
    },
  );
}

export async function getMessages(nanoid: string, workspace: string) {
  return serverFetch<ChatMessage[]>(`${BASE}/rooms/${nanoid}/messages/`, {
    workspace,
  });
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
  return serverFetch<ChatAgent[]>(`${BASE}/agents/`, { workspace });
}

export async function getAgent(nanoid: string, workspace: string) {
  return serverFetch<ChatAgent>(`${BASE}/agents/${nanoid}/`, { workspace });
}
