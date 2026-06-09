import type { NotificationDto } from "../models/notification"
import { api } from "./api"

export const getNotifications = async (
    id: number
) : Promise<NotificationDto[]> => {
    const res = await api.get(`/notifications/user/${id}`)

    return res.data
} 