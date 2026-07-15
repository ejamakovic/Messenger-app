import type { UserModel } from "./user";

export type MessageReactionDto = {
  id: number;
  messageId: number;
  conversationId: number;
  user: UserModel;
  emoji: string;
  timestamp: string;
};