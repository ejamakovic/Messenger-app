import { api } from "./api";
import type { MessageReactionDto } from "../models/reaction";

export const getReactions = async (messageId: number): Promise<MessageReactionDto[]> => {
  const res = await api.get(`/messages/${messageId}/reactions`);
  return res.data;
};

export const addReaction = async (
  messageId: number,
  emoji: string
): Promise<MessageReactionDto | null> => {
  const res = await api.post(`/messages/${messageId}/reactions`, { emoji });
  return res.data;
};

export const removeReaction = async (messageId: number, emoji: string): Promise<void> => {
  await api.delete(`/messages/${messageId}/reactions`, { params: { emoji } });
};

export const getAvailableEmojis = async (): Promise<string[]> => {
  const res = await api.get(`/reactions/available`);
  return res.data;
};