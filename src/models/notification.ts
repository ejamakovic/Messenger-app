
export type NotificationDto = {
    id: number;
    content: string;
    isRead: boolean;
    sourceId?: number; // convId, userId, requestId, idk...
} 