export type ConversationListDto = {
    id: number;
    name: string;          // The name of the chat/recipient
    lastMessage: string;   // Preview snippet text
    unreadCount: number;   // Dynamic unread count database response metric
    senderId?: number;
    senderUsername?: string;
    timestamp?: string;   
}