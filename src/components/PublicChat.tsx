import { useEffect, useState } from "react"
import { getPublicMessages } from "../services/message.service"

type Message = {
  sender: {
    id: number
    username: string
    connected: boolean
    createdAt: string
  }
  content: string
}

export default function PublicChat({ liveMessages }: any) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    getPublicMessages(0, 30)
      .then((data) => {
        console.log("📦 INITIAL MESSAGES:", data)

        if (!Array.isArray(data)) return

        setMessages(data.reverse())
      })
      .catch((err) => {
        console.log("❌ LOAD ERROR:", err)
      })
  }, [])

  useEffect(() => {
    if (!liveMessages) return

    setMessages((prev) => [...prev, liveMessages])
  }, [liveMessages])

  return (
    <div
      style={{
        flex: 1,
        padding: 20,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <h2>Public Chat</h2>

      {messages.map((m, i) => (
        <div key={i}>
          <b>{m.sender?.username}:</b> {m.content}
        </div>
      ))}
    </div>
  )
}