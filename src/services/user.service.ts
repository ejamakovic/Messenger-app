import { api } from "./api"
import type { User } from "../models/user"

export const getOnlineUsers = async (): Promise<User[]> => {
  const res = await api.get("/users/connected")
  return res.data
}

export const registerUser = async (currentUser: User): Promise<User> => {
  const res = await api.post("/users/create", currentUser)
  return res.data
}

export const logoutUser = async (currentUser: User): Promise<void> => {
  await api.post("/users/logout", currentUser)
}