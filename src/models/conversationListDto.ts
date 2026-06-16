export type ConversationListDto = {
    id: number
    name: string
    imageUrl?: string
    lastMessage: string
    unreadCount: number
    senderUsername?: string    
    timestamp?: string
}