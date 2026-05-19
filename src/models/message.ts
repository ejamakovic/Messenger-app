import type { Attachment } from "./attachment"
import type { User } from "./user"

export type Message = {
  id: number
  content: string
  sender: User
  conversationId: number
  timestamp: string
  attachments?: Attachment[]
} 
