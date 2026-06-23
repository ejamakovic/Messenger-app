import { api } from "./api"
import type { UserModel } from "../models/user"

export const getOnlineUsers = async (): Promise<UserModel[]> => {
  const res = await api.get("/users/connected")
  return res.data
}

export const logoutUser = async (currentUser: UserModel): Promise<void> => {
  await api.patch("/users/logout", currentUser)
}