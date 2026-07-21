import { api } from "./api";
import type { MessageReaction } from "../models/messageReaction";

export const getReactions = async (messageId: number): Promise<MessageReaction[]> => {
  const res = await api.get(`/messages/${messageId}/reactions`);
  return res.data;
};

/** Same emoji again removes it; a different emoji overwrites it. */
export const setReaction = async (messageId: number, emoji: string): Promise<MessageReaction | null> => {
  const res = await api.post(`/messages/${messageId}/reactions`, { emoji });
  return res.data;
};

export const getAvailableEmojis = async (): Promise<string[]> => {
  const res = await api.get(`/reactions/available`);
  return res.data;
};