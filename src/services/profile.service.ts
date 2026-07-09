import { api } from "./api";
import type { UserModel } from "../models/user";

// BE TODO: GET /users/{id}/profile -> UserModel (incl. firstName, lastName, email, bio, avatarUrl)
export const getUserProfile = async (userId: number): Promise<UserModel> => {
  const res = await api.get(`/users/${userId}/profile`);
  return res.data;
};

// BE TODO: PATCH /users/{id} -> accepts partial UserModel, returns updated UserModel
export const updateProfile = async (
  userId: number,
  data: Partial<UserModel>
): Promise<UserModel> => {
  const res = await api.patch(`/users/${userId}`, data);
  return res.data;
};

// BE TODO: POST /users/{id}/avatar (multipart/form-data, field name "file") -> { avatarUrl: string }
export const uploadAvatar = async (
  userId: number,
  file: File
): Promise<{ avatarUrl: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post(`/users/${userId}/avatar`, formData);
  return res.data;
};