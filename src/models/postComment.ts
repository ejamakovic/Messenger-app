export type PostCommentDto = {
  id: number
  postId: number
  parentCommentId?: number | null
  authorId: number
  authorUsername: string
  authorAvatarUrl?: string
  content: string
  createdAt: string
  replyCount: number
  reactionCounts: Record<string, number>
  myReaction?: string | null
}