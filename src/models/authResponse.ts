// AuthResponse.ts

import type { UserModel } from "./user";

export type AuthResponse = {
  user: UserModel;
  accessToken: string;
  refreshToken: string;
};