"use server";

import { revalidatePath } from "next/cache";
import {
  createRoom,
  closeRoom,
  assignAgent,
  transferRoom,
  createChatAgent,
  deleteChatAgent,
} from "@/lib/api";

interface ActionResult {
  status?: string;
  message?: string;
}

export async function createChatRoom(workspace: string) {
  const room = await createRoom(workspace);
  revalidatePath(`/${workspace}/dashboard/livechat`);
  return room;
}

export async function closeChatRoom(nanoid: string, workspace: string) {
  await closeRoom(nanoid, workspace);
  revalidatePath(`/${workspace}/dashboard/livechat`);
}

export async function assignChatAgent(
  nanoid: string,
  workspace: string,
) {
  await assignAgent(nanoid, workspace);
  revalidatePath(`/${workspace}/dashboard/livechat`);
}

export async function transferChatRoom(
  nanoid: string,
  agentNanoid: string,
  workspace: string,
) {
  await transferRoom(nanoid, agentNanoid, workspace);
  revalidatePath(`/${workspace}/dashboard/livechat`);
}

export async function createChatAgentAction(
  userNanoid: string,
  workspace: string,
) {
  const agent = await createChatAgent(userNanoid, workspace);
  revalidatePath(`/${workspace}/dashboard/livechat`);
  return agent;
}

export async function removeChatAgentAction(
  nanoid: string,
  workspace: string,
) {
  await deleteChatAgent(nanoid, workspace);
  revalidatePath(`/${workspace}/dashboard/livechat`);
}
