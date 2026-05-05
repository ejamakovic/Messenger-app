import { useEffect, useState } from "react"

import OnlineUsers from "../components/OnlineUsers"
import MessageInput from "../components/MessageInput"
import PublicChat from "../components/PublicChat"

import { connectSocket, sendMessage } from "../services/socket.service"
import { login, getMe } from "../services/jwt.service"
import { logoutUser } from "../services/user.service"
import { getPublicMessages } from "../services/message.service"

import type { User } from "../models/user"
import type { Message } from "../models/message"
import type { AuthResponse } from "../services/jwt.service"

const createUsername = () => {
  const random = Math.random().toString(36).substring(2, 10)
  return `USER-${random}`
}

export default function PublicChatPage() {

  const [user, setUser] = useState<User | null>(null)
  const [chat, setChat] = useState<Message[]>([])
  const [socketReady, setSocketReady] = useState(false)

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
        const res: AuthResponse = await getMe()

        localStorage.setItem("token", res.token)
        setUser(res.user)

      } catch (err) {
        const res: AuthResponse = await login(username)

        localStorage.setItem("token", res.token)
        setUser(res.user)
      }
    }

    init()
  }, [])

  useEffect(() => {
    getPublicMessages()
      .then((data) => setChat(data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!user) return

    const token = localStorage.getItem("token")
    if (!token) return

    connectSocket(token, {
      onChatMessage: (msg) => {
        setChat((prev) => [...prev, msg])
      },

      onUserJoin: (u) => {
        console.log("👤 user joined:", u)
      }
    })

    setSocketReady(true)

  }, [user])

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
    if (!user || !socketReady) return

    sendMessage({
      type: "chat",
      sender: user.username,
      receiver: null,
      content: text,
    })
  }

  if (!user) return <div>Loading...</div>

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      <div style={{ width: 250, borderRight: "1px solid #ddd" }}>
        <div style={{ padding: "12px", fontWeight: "bold" }}>
          👤 {user.username}
        </div>

        <OnlineUsers currentUser={user} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        <PublicChat
          currentUser={user}
          messages={chat}
        />

        <MessageInput onSend={handleSend} />

      </div>

    </div>
  )
}