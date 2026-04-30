import { api } from "./api"

export const getOnlineUsers = async () => {
  const res = await api.get("/users/connected")
  return res.data
}

export const registerUser = async (user: { username: string }) => {
  const res = await api.post("/users/create", user)
  return res.data
}