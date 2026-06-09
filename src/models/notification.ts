import type { UserModel } from "./user"

export type NotificationDto = {
    id: number
    recipient: UserModel
    referenceId: number
    notificationType: string
    status: string
    content: string    
    timestamp: string
} 