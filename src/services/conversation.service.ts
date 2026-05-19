import type { Conversation } from "../models/conversation";
import { api } from "./api";

export const getPublicConversation =
  async (): Promise<Conversation> => {

    const res = await api.get(
      "/conversations/global"
    );

    return res.data;
};
