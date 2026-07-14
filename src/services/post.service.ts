import { api } from "./api";
import type { Post, PostPrivacy } from "../models/post";
import type { Page } from "../models/Page";

// BE TODO: GET /posts/user/{userId}?page&size -> Page<Post>
// Should only return posts the requester is allowed to see (respect PRIVACY: PUBLIC/FRIENDS/PRIVATE)
export const getUserPosts = async (
  userId: number,
  page = 0,
  size = 20
): Promise<Page<Post>> => {
  const res = await api.get(`/posts/user/${userId}`, { params: { page, size } });
  return res.data;
};

// BE TODO: POST /posts (multipart/form-data: authorId, content, privacy, image?) -> Post
export const createPost = async (
  content: string,
  privacy: PostPrivacy,
  image?: File
): Promise<Post> => {

  const formData = new FormData();

  formData.append("content", content);
  formData.append("privacy", privacy);

  if(image)
      formData.append("image", image);

  const res = await api.post("/posts", formData);

  return res.data;
};

// BE TODO: PATCH /posts/{id} (content? and/or privacy?) -> Post
// Must verify on BE that only the post's author can edit it
export const updatePost = async (
  postId: number,
  data: Partial<Pick<Post, "content" | "privacy">>
): Promise<Post> => {
  const res = await api.patch(`/posts/${postId}`, data);
  return res.data;
};

// BE TODO: DELETE /posts/{id} -> must verify only the author can delete
export const deletePost = async (postId: number): Promise<void> => {
  await api.delete(`/posts/${postId}`);
};