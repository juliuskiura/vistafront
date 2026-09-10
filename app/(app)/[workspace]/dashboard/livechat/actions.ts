"use server";

import { createRoom, closeRoom, assignAgent } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createChatRoom(workspace: string) {
  const room = await createRoom(workspace);
  revalidatePath(`/${workspace}/dashboard/livechat`);
  return room;
}

export async function closeChatRoom(nanoid: string, workspace: string) {
  await closeRoom(nanoid, workspace);
  revalidatePath(`/${workspace}/dashboard/livechat`);
}

export async function assignChatAgent(nanoid: string, workspace: string) {
  await assignAgent(nanoid, workspace);
  revalidatePath(`/${workspace}/dashboard/livechat`);
}
