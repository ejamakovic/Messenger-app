import type { User } from "../models/user";
import { api } from "./api" // ili obavezni import za axios

export const login = async (username: string): Promise<User> => {
  const res = await api.post(
    "/auth/login",
    null,
    {
      params: { username }      
    }
  );

  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await api.get("/auth/me");

  return res.data;
};

