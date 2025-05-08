export interface ChatUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

export interface ChatSession {
  id: string
  user_id: string
  status: string  // 'unread' | 'read' | 'active'
  created_at: string
  updated_at: string
  user: ChatUser
  messages?: ChatMessage[]
}

export interface ChatMessage {
  id: string
  content: string
  created_at: string
  session_id: string
  sender_id: string
  sender?: ChatUser | null
}

export type ChatStatus = 'unread' | 'read' | 'active'; 