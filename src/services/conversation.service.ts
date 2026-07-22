
import type { Attachment } from "../models/attachment";
import type { Conversation } from "../models/conversation";
import type { ConversationListDto } from "../models/conversationListDto";
import type { ConversationMemberDto } from "../models/conversationMember";
import type { Page } from "../models/Page";
import type { UserModel } from "../models/user";
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
export const patchConversationLastSeen = async (
  conversationId: number,
  userId: number,
  lastSeenMessageId: number
): Promise<void> => {
  // 🔍 LOG 4: Trace the raw payload mapping structure before transmission
  console.log("📡 Axios Request executing:", {
    url: `/conversations/${conversationId}/last-seen`,
    body: { userId, lastSeenMessageId }
  });

  await api.patch(`/conversations/${conversationId}/last-seen`, {
    userId,
    lastSeenMessageId
  });
}

// BE TODO: POST /conversations/group  body: { name: string, memberIds: number[] } -> Conversation (type "GROUP")
export const createGroupConversation = async (
  name: string,
  memberIds: number[]
): Promise<Conversation> => {
  const res = await api.post(`/conversations/group`, { name, memberIds });
  return res.data;
};

export const getLastSeenMessageId = async (conversationId: number): Promise<number> => {
  const res = await api.get(`/conversations/${conversationId}/last-seen`);
  return res.data.lastSeenMessageId;
};

export const getConversationMembers = async (id: number): Promise<ConversationMemberDto[]> => {
  const res = await api.get(`/conversations/${id}/members`)
  return res.data
}

export const addConversationMember = async (id: number, userId: number) => {
  const res = await api.post(`/conversations/${id}/members`, { userId })
  return res.data
}

export const removeConversationMember = async (id: number, userId: number) => {
  await api.delete(`/conversations/${id}/members/${userId}`)
}

export const changeConversationMemberRole = async (id: number, userId: number, role: string) => {
  const res = await api.patch(`/conversations/${id}/members/${userId}/role`, { role })
  return res.data
}

export const getAvailableUsersForConversation = async (id: number): Promise<UserModel[]> => {
  const res = await api.get(`/conversations/${id}/available-users`)
  return res.data
}

export const updateConversationDetails = async (id: number, name?: string, imageUrl?: string) => {
  const res = await api.patch(`/conversations/${id}/details`, { name, imageUrl })
  return res.data
}

export const uploadConversationImage = async (id: number, file: File): Promise<{ imageUrl: string }> => {
  const formData = new FormData()
  formData.append("file", file)
  const res = await api.post(`/conversations/${id}/image`, formData)
  return res.data
}

export const getConversationMedia = async (conversationId: number): Promise<Attachment[]> => {
  const res = await api.get(`/messages/conversation/${conversationId}/media`)
  return res.data
}