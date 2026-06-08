import type { Attachment } from "./attachment"
import type { UserModel } from "./user"

export type Message = {
  id: number
  content: string
  sender: UserModel
  conversationId: number
  timestamp: string
  attachments?: Attachment[]
} 
