import { api } from "./api"

export const getPublicMessages = async (page = 0, size = 30) => {
  const res = await api.get("/messages/global", {
    params: { page, size }
  })

  return res.data
}

export const sendMessage = async (message: any) => {
  const res = await api.post("/messages/create", message)
  return res.data
}