
import type { Conversation } from "../models/conversation";
import type { ConversationListDto } from "../models/conversationListDto";
import type { Page } from "../models/Page";
import { api } from "./api";

export const getPublicConversation = async (

) : Promise<Conversation> => {

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

/**
 * Updates the last seen message tracking for a specific user within a conversation.
 */
export const putLastSeenMessageInConversationForUser = async (
  userId: number,
  lastSeenMessageId: number,
  conversationId: number
) => {
  
  const res = await api.patch(`/conversations/${conversationId}/last-seen`, {}, {
    params: { userId, lastSeenMessageId }
  });

  return res.data
}