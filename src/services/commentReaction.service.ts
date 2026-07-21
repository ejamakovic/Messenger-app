import { api } from "./api";
import type { CommentReactionDto } from "../models/commentReaction";

export const setCommentReaction = async (commentId: number, emoji: string): Promise<CommentReactionDto | null> => {
  const res = await api.post(`/posts/comments/${commentId}/reactions`, { emoji });
  return res.data;
};

export const getCommentReactions = async (commentId: number): Promise<CommentReactionDto[]> => {
  const res = await api.get(`/posts/comments/${commentId}/reactions`);
  return res.data;
};