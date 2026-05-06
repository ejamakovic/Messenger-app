import type { Message } from "../models/message"
import type { User } from "../models/user"

export default function PublicChat({
  currentUser,
  messages,
  containerRef,
  onScroll,
}: {
  currentUser: User
  messages: Message[]
  containerRef: React.RefObject<HTMLDivElement | null>
  onScroll: () => void
}) {
  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      style={{
        padding: 10,
        overflowY: "auto",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {messages.map((msg) => {
        const isMine = msg.sender?.username === currentUser.username

        return (
          <div
            key={`${msg.sender?.username}-${msg.timestamp}-${msg.content}`}
            style={{
              display: "flex",
              justifyContent: isMine ? "flex-end" : "flex-start",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                maxWidth: "60%",
                padding: "8px 12px",
                borderRadius: 12,
                backgroundColor: isMine ? "#4f46e5" : "#e5e7eb",
                color: isMine ? "white" : "black",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {msg.sender?.username}
              </div>
              <div>{msg.content}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}