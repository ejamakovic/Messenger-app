import { useEffect, useState } from "react"

import OnlineUsers from "../components/OnlineUsers"
import PublicChat from "../components/PublicChat"
import MessageInput from "../components/MessageInput"

import { createUser, type User } from "../utils/createUser"
import { registerUser } from "../services/user.service"

import { connectSocket, sendMessage } from "../services/socket.service"

export default function PublicChatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [liveMessage, setLiveMessage] = useState<any>(null)

  useEffect(() => {
    let stored = sessionStorage.getItem("user")
    let currentUser: User

    if (stored) {
      currentUser = JSON.parse(stored)
    } else {
      currentUser = createUser()
      sessionStorage.setItem("user", JSON.stringify(currentUser))
      registerUser(currentUser)
    }

    setUser(currentUser)

    connectSocket((msg) => {
      console.log("📩 WS MESSAGE:", msg)
      setLiveMessage(msg)
    })

  }, [])

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

      <div style={{ width: 250, borderRight: "1px solid #ddd" }}>
        <div
          style={{
            padding: "12px",
            borderBottom: "1px solid #ddd",
            fontWeight: "bold",
          }}
        >
          👤 Logged in as: {user.username}
        </div>

        <OnlineUsers />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <PublicChat liveMessages={liveMessage} />
        <MessageInput onSend={handleSend} />
      </div>

    </div>
  )
}