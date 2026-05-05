import { useState } from "react"

export default function MessageInput({
  onSend,
}: {
  onSend: (text: string) => void
}) {
  const [text, setText] = useState("")

  return (
    <div style={{ padding: 10, borderTop: "1px solid gray", display: "flex", gap: 8 }}>
      
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (!text.trim()) return
            onSend(text)
            setText("")
          }
        }}
        placeholder="Type message..."
        style={{ flex: 1 }}
      />

      <button
        onClick={() => {
          if (!text.trim()) return
          onSend(text)
          setText("")
        }}
      >
        Send
      </button>

    </div>
  )
}