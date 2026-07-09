import { api } from "./api"
import type { UserModel } from "../models/user"

export const getOnlineUsers = async (): Promise<UserModel[]> => {
  const res = await api.get("/users/connected")
  return res.data
}

export const logoutUser = async (currentUser: UserModel): Promise<void> => {
  await api.patch("/users/logout", currentUser)
}

// BE TODO: GET /users -> all registered users (needed for the group-chat member picker)
export const getAllUsers = async (): Promise<UserModel[]> => {
  const res = await api.get("/users");
  return res.data;
};