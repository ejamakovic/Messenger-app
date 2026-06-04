import type { ConversationListDto } from "../components/Sidebar/Sidebar";
import type { Conversation } from "../models/conversation";
import type { Page } from "../models/Page";
import { api } from "./api";

export const getPublicConversation =
  async (): Promise<Conversation> => {

    const res = await api.get(
      `/conversations/global`
    );

    return res.data;
};

export const getUserConversations = async (
  userId: number,
  page = 0,
  size = 30
) : Promise<Page<ConversationListDto>> => {
  const res = await api.get(`/conversations/user/${userId}`, {
    params: { page, size },
  });

  return res.data
}

export const getOrCreatePrivateConversation = async (
  senderId: number,
  receiverId: number
) : Promise<Conversation> => {
  const res = await api.get(`/conversations/private`, {
    params: { senderId, receiverId },
  });
  return res.data
}

export const getConversation = async (
  id: number
) : Promise<Conversation> => {
  const res = await api.get(`/conversations/${id}`);

  return res.data
}
