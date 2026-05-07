export default function MessageInput({
  text,
  file,
  onTextChange,
  onFileSelect,
  onSend,
}: {
  text: string
  file: File | null
  onTextChange: (text: string) => void
  onFileSelect: (file: File | null) => void
  onSend: () => void
}) {
  return (
    <div
      style={{
        padding: 10,
        borderTop: "1px solid gray",
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      {/* FILE INPUT */}
      <input
        type="file"
        onChange={(e) => {
          const f = e.target.files?.[0] || null
          onFileSelect(f)
        }}
      />

      {/* TEXT INPUT */}
      <input
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (!text.trim() && !file) return
            onSend()
          }
        }}
        placeholder="Type message..."
        style={{ flex: 1 }}
      />

      {/* PREVIEW FILE (optional ali korisno) */}
      {file && (
        <span style={{ fontSize: 12 }}>
          📎 {file.name}
        </span>
      )}

      <button
        onClick={() => {
          if (!text.trim() && !file) return
          onSend()
        }}
      >
        Send
      </button>
    </div>
  )
}