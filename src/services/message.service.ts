import type { Message } from "../models/message"
import type { Page } from "../models/Page"
import { api } from "./api"

export const getPublicMessages = async (
  page = 0,
  size = 30
): Promise<Page<Message>> => {
  const res = await api.get("/messages/globalPage", {
    params: { page, size }
  })

  return res.data
}
