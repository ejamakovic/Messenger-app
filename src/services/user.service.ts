import { api } from "./api"
import type { UserModel } from "../models/user"

export const getOnlineUsers = async (): Promise<UserModel[]> => {
  const res = await api.get("/users/connected")
  return res.data
}

export const registerUser = async (currentUser: UserModel): Promise<UserModel> => {
  const res = await api.post("/users/create", currentUser)
  return res.data
}

export const logoutUser = async (currentUser: UserModel): Promise<void> => {
  await api.post("/users/logout", currentUser)
}