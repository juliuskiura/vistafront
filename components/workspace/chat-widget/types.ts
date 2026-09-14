export interface ChatMessage {
  nanoid: string;
  content: string;
  sender_name: string | null;
  source: "customer" | "admin";
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
}

export interface ChatRoom {
  nanoid: string;
  is_active: boolean;
  agent_name: string | null;
  customer_name: string | null;
  unread_count?: number;
  created_at: string;
  updated_at?: string;
  closed_at?: string | null;
}