import type { User } from "./user"

export type Message = {
  content: string
  sender: User
  receiver?: User | null
  timestamp?: string
}