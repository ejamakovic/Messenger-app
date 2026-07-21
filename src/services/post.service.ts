import { api } from "./api";
import type { Post, PostPrivacy } from "../models/post";
import type { Page } from "../models/Page";

export const getUserPosts = async (userId: number, page = 0, size = 20): Promise<Page<Post>> => {
  const res = await api.get(`/posts/user/${userId}`, { params: { page, size } });
  return res.data;
};

export const getFeed = async (page = 0, size = 10): Promise<Page<Post>> => {
  const res = await api.get(`/posts/feed`, { params: { page, size } });
  return res.data;
};

export const createPost = async (content: string, privacy: PostPrivacy, media?: File[]): Promise<Post> => {
  const formData = new FormData();
  formData.append("content", content);
  formData.append("privacy", privacy);
  (media || []).forEach((file) => formData.append("media", file));

  const res = await api.post("/posts", formData);
  return res.data;
};

export const updatePost = async (postId: number, data: Partial<Pick<Post, "content" | "privacy">>): Promise<Post> => {
  const res = await api.patch(`/posts/${postId}`, data);
  return res.data;
};

export const deletePost = async (postId: number): Promise<void> => {
  await api.delete(`/posts/${postId}`);
};