import type { Conversation } from "../models/conversation";
import type { Page } from "../models/Page";
import { api } from "./api";

export const getPublicConversation =
  async (): Promise<Conversation> => {

    const res = await api.get(
      "/conversations/global"
    );

    return res.data;
};

export const getUserConversations = async (
  userId: number,
  page = 0,
  size = 30
) : Promise<Page<Conversation>> => {
  const res = await api.get(`/conversations/user/${userId}`, {
    params: { page, size },
  });

  return res.data
}
