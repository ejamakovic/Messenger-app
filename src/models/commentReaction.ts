export type CommentReactionDto = {
  id: number
  commentId: number
  postId: number
  user: { id: number; username: string }
  emoji: string
  timestamp: string
}