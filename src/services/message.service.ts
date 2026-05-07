import type { Chat } from "../models/chat"
import type { Message } from "../models/message"
import type { Page } from "../models/Page"
import { api } from "./api"

export const sendMessage = async (
  sender: string,
  receiver: string | null,
  content: string | null,
  file: File | null
) => {
  const formData = new FormData()

  formData.append("sender", sender)

  if (receiver) {
    formData.append("receiver", receiver)
  }

  if (content) {
    formData.append("content", content)
  }

  if (file) {
    formData.append("file", file)
  }

  const res = await api.post("/messages/send", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return res.data
}

export const getPublicMessages = async (
  page = 0,
  size = 30
): Promise<Page<Message>> => {
  const res = await api.get("/messages/globalPage", {
    params: { page, size }
  })

  return res.data
}

export const getPrivateMessages = async (
  sender: string,
  receiver: string,
  page = 0,
  size = 30
): Promise<Page<Message>> => {
  if (!sender || !receiver) {
    throw new Error("sender or receiver missing")
  }

  const res = await api.get("/messages/privatePage", {
    params: { sender, receiver, page, size }
  })

  return res.data
}

export const getAllPrivateChats = async (
  username: string,
  page = 0,
  size = 20
): Promise<Page<Chat>> => {
  const res = await api.get("/messages/allPrivateChats",{
    params: {username, page, size}
  });

  return res.data
}
