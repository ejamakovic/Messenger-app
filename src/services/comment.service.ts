import { api } from "./api";
import type { PostCommentDto } from "../models/postComment";
import type { Page } from "../models/Page";

export const getComments = async (postId: number, page = 0, size = 10): Promise<Page<PostCommentDto>> => {
  const res = await api.get(`/posts/${postId}/comments`, { params: { page, size } });
  return res.data;
};

export const getReplies = async (commentId: number, page = 0, size = 10): Promise<Page<PostCommentDto>> => {
  const res = await api.get(`/posts/comments/${commentId}/replies`, { params: { page, size } });
  return res.data;
};

export const addComment = async (postId: number, content: string, parentCommentId?: number): Promise<PostCommentDto> => {
  const res = await api.post(`/posts/${postId}/comments`, { content, parentCommentId });
  return res.data;
};

export const deleteComment = async (commentId: number): Promise<void> => {
  await api.delete(`/posts/comments/${commentId}`);
};