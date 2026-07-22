// src/models/conversationMember.ts
import type { UserModel } from "./user"

export type ConversationMemberDto = {
  id: number
  user: UserModel
  role: "MEMBER" | "ADMIN" | "OWNER"
  joinedAt: string
}