import type { Message } from "../models/message"
import type { Page } from "../models/Page"
import { api } from "./api"

export const sendMessage = async (
  senderId: number,
  conversationId: number,
  content: string,
  file?: File | null
) => {
  const formData = new FormData();

  formData.append("senderId", String(senderId))
  formData.append("conversationId", String(conversationId))

  if (content) {
    formData.append("content", content)
  }

  if (file) {
    formData.append("file", file)
  }

  const res = await api.post("/messages/send", formData)

  return res.data
}

export const getConversationMessages = async (
  conversationId: number,
  page = 0,
  size = 30
): Promise<Page<Message>> => {
  const res = await api.get(`/messages/conversation/${conversationId}`, {
    params: { page, size },
  });

  return res.data
}

