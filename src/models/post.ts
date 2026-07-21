export type PostPrivacy = "PUBLIC" | "FRIENDS" | "PRIVATE";

export type PostMedia = {
  id: number
  url: string
  fileType?: string
}

export type Post = {
  id: number
  authorId: number
  authorUsername: string
  authorAvatarUrl?: string
  content: string
  media: PostMedia[]
  privacy: PostPrivacy
  createdAt: string
  commentCount: number
  reactionCounts: Record<string, number>
  reactionCount: number
  myReaction?: string | null
  isFriend: boolean
}