import type { Message } from "../models/message"
import type { User } from "../models/user"

export default function PublicChat({
  currentUser,
  messages,
}: {
  currentUser: User
  messages: Message[]
}) {
  return (
    <div style={{ padding: 10, overflowY: "auto", flex: 1 }}>
      
      {messages.map((msg, index) => {
        const isMine = msg.sender?.username === currentUser.username

        return (
          <div
            key={index}
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

              {msg.timestamp && (
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              )}

            </div>

          </div>
        )
      })}

    </div>
  )
}