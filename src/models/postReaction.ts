export type PostReactionDto = {
  id: number
  postId: number
  user: { id: number; username: string }
  emoji: string
  timestamp: string
}