import type { NotificationDto } from "../models/notification"
import { api } from "./api"

export const getNotifications = async (
    id: number
) : Promise<NotificationDto[]> => {
    const res = await api.get(`/notifications/user/${id}`)

    return res.data
} 

export const putNotificationStatus = async (
    id: number,
    status: string
) : Promise<NotificationDto> => {
    const res = await api.patch(`/notifications/${id}/status`,
        status,
        {
            headers: {
                "Content-Type": "text/plain"
            }
        }
    );
    
    return res.data
}