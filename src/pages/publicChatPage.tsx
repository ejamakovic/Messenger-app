import { useEffect, useState } from "react"

import OnlineUsers from "../components/OnlineUsers"
import MessageInput from "../components/MessageInput"
import { connectSocket, sendMessage } from "../services/socket.service"

import { login, getMe } from "../services/jwt.service"
import { logoutUser } from "../services/user.service"
import type { User } from "../models/user"
import PublicChat from "../components/PublicChat"


const createUsername = () => {
  const random = Math.random().toString(36).substring(2, 10)
  return `USER-${random}`
}

export default function PublicChatPage() {
  const [user, setUser] = useState<User | null>(null)

useEffect(() => {
  const init = async () => {
    let stored = localStorage.getItem("user")

    let username: string

    if (stored) {
      username = JSON.parse(stored).username
    } else {
      username = createUsername()
      localStorage.setItem("user", JSON.stringify({ username }))
    }

    try {
      // 1. probaj uzeti usera iz cookie-a
      const me = await getMe()
      setUser(me)
    } catch (err) {
      // 2. ako nema session → login
      const me = await login(username)
      setUser(me)
    }
  }

  init()
}, [])

  // LOGOUT ON BROWSER CLOSE
  useEffect(() => {
    const handleClose = () => {
      if (!user) return

      logoutUser(user)
    }

    window.addEventListener("beforeunload", handleClose)

    return () => {
      window.removeEventListener("beforeunload", handleClose)
    }
  }, [user])

  const handleSend = (text: string) => {
    if (!user) return

    sendMessage({
      type: "public",
      sender: user.username,
      content: text,
    })
  }

  if (!user) return <div>Loading...</div>

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* LEFT SIDE */}
      <div style={{ width: 250, borderRight: "1px solid #ddd" }}>
        <div style={{ padding: "12px", fontWeight: "bold" }}>
          👤 {user.username}
        </div>

        <OnlineUsers />
      </div>

      <PublicChat />

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <MessageInput onSend={handleSend} />
      </div>

    </div>
  )
}