import type { UserModel } from "./user";

export type MessageReaction = {
  id: number;
  messageId: number;
  conversationId: number;
  user: UserModel;
  emoji: string;
  timestamp: string;
};