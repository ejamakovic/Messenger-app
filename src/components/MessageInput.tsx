import { useState } from "react"

export default function MessageInput({
  onSend,
}: {
  onSend: (text: string) => void
}) {
  const [text, setText] = useState("")

  return (
    <div style={{ padding: 10, borderTop: "1px solid gray" }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type message..."
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