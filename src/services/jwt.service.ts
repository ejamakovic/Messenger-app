import type { User } from "../models/user";
import { api } from "./api" // ili obavezni import za axios

export type AuthResponse = {
  user: User
  token: string
}

export const login = async (username: string): Promise<AuthResponse> => {
  const res = await api.post("/auth/login", null, {
    params: { username }
  })

  return res.data
}

export const getMe = async (): Promise<AuthResponse> => {
  const res = await api.get("/auth/me")
  return res.data
}

