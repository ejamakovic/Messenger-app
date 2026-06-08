import type { UserModel } from "../models/user";
import { api } from "./api" 

export type AuthResponse = {
  user: UserModel
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

