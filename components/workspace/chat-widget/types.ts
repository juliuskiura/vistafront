export interface ChatMessage {
  nanoid: string;
  content: string;
  sender_name: string | null;
  source: "customer" | "admin";
  is_read: boolean;
  is_system?: boolean;
  is_deleted: boolean;
  created_at: string;
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  nanoid: string;
  room: string;
  message: string | null;
  file: string;
  file_name: string | null;
  file_type: string;
  file_size: number;
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