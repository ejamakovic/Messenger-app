import { api } from "./api";
import type { PostReactionDto } from "../models/postReaction";

export const setPostReaction = async (postId: number, emoji: string): Promise<PostReactionDto | null> => {
  const res = await api.post(`/posts/${postId}/reactions`, { emoji });
  return res.data;
};

export const getPostReactions = async (postId: number): Promise<PostReactionDto[]> => {
  const res = await api.get(`/posts/${postId}/reactions`);
  return res.data;
};