import type { ChatRoom } from "@/lib/api/livechat";

export interface RoomLastMessage {
  nanoid: string;
  content: string;
  sender_name: string | null;
  created_at: string;
}

export interface RoomFeedRoom {
  nanoid: string;
  is_active: boolean;
  customer_name: string | null;
  agent_name: string | null;
  created_at: string | null;
  last_message: RoomLastMessage | null;
  unread_count: number;
}

export function mapChatRoomToFeed(room: ChatRoom): RoomFeedRoom {
  return {
    nanoid: room.nanoid,
    is_active: room.is_active,
    customer_name: room.customer_name ?? null,
    agent_name: room.agent?.user_name ?? room.agent_name ?? null,
    created_at: room.created_at ?? null,
    last_message: room.last_message ?? null,
    unread_count: room.unread_count ?? 0,
  };
}

export function mapChatRoomsToFeed(rooms: ChatRoom[]): RoomFeedRoom[] {
  return rooms.map(mapChatRoomToFeed);
}
