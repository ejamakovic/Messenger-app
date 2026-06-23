// jwt.service.ts

import type { AuthResponse } from "../models/authResponse";
import type { RegisterRequest } from "../models/registerRequest";
import { api } from "./api" 

export const login = async (
  username: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post("/auth/login", { username, password });
  return response.data;
};

// ── FIXED REGISTRATION FUNCTION ───────────────────────────────────────────
export const register = async (
  payload: RegisterRequest
): Promise<AuthResponse> => {
  // Spreading payload ensures username, email, password, firstName, and lastName are all sent
  const response = await api.post("/auth/register", { ...payload });
  return response.data;
};

export const getMe = async (): Promise<AuthResponse> => {
  const res = await api.get("/auth/me");
  return res.data;
};