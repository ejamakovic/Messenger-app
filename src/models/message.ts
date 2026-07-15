import type { Attachment } from "./attachment"
import type { MessageReaction } from "./messageReaction"
import type { UserModel } from "./user"

export type Message = {
  id: number
  content: string
  status: string
  sender: UserModel
  conversationId: number
  timestamp: string
  attachments?: Attachment[]
  messageReactions?: MessageReaction[]
} 
