import { useEffect, useLayoutEffect, useRef } from "react"
import type { Message } from "../models/message"
import type { User } from "../models/user"

export default function PublicChat({
  currentUser,
  messages,
  onLoadMore,
}: {
  currentUser: User
  messages: Message[]
  onLoadMore?: () => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const shouldAutoScroll = useRef(true)

  // DOM anchor (NOT string ID)
  const anchorRef = useRef<HTMLElement | null>(null)

  const onScroll = () => {
    const el = containerRef.current
    if (!el) return

    if (el.scrollTop < 50) {
      // capture FIRST visible DOM element
      anchorRef.current = el.children[0] as HTMLElement

      onLoadMore?.()
    }

    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100

    shouldAutoScroll.current = isNearBottom
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // follow chat (bottom)
    if (shouldAutoScroll.current) {
      el.scrollTop = el.scrollHeight
      return
    }

    // restore anchor DOM position
    if (anchorRef.current) {
      const targetTop = anchorRef.current.offsetTop

      el.scrollTop = targetTop

      anchorRef.current = null
    }
  }, [messages])

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
      {messages.map((msg, index) => {
        const isMine = msg.sender?.username === currentUser.username

        // stable key using timestamp + sender
        const key = `${msg.sender?.username}-${msg.timestamp}-${msg.content}`

        return (
          <div
            key={key}
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