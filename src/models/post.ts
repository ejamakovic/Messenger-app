export type PostPrivacy = "PUBLIC" | "FRIENDS" | "PRIVATE";

export type Post = {
  id: number
  authorId: number
  content: string
  imageUrl?: string
  privacy: PostPrivacy
  createdAt: string
}