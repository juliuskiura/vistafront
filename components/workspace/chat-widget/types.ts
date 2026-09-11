export interface ChatMessage {
  nanoid: string;
  content: string;
  sender_name: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface ChatRoom {
  nanoid: string;
  is_active: boolean;
  agent_name: string | null;
  customer_name: string | null;
  created_at: string;
  updated_at?: string;
}