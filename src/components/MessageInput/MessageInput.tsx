import styles from "../MessageInput/MessageInput.module.css"

export default function MessageInput({
  text,
  file,
  onTextChange,
  onFileSelect,
  onSend
}: any) {
  return (<div className={styles.container}>

<input
  type="file"
  accept="image/*,video/*"
  onChange={(e) => {

    const selected =
      e.target.files?.[0]

    if (!selected) return

    const isImage =
      selected.type.startsWith("image/")

    const isVideo =
      selected.type.startsWith("video/")

    if (!isImage && !isVideo) {

      alert(
        "Only images and videos allowed"
      )

      e.target.value = ""

      return
    }

    const maxSize =
      50 * 1024 * 1024 // 50MB

    if (selected.size > maxSize) {

      alert(
        "File too large (max 50MB)"
      )

      e.target.value = ""

      return
    }

    onFileSelect(selected)
  }}
/>

  <input
    className={styles.input}
    value={text}
    onChange={(e) => onTextChange(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") onSend()
    }}
    placeholder="Type message..."
  />

  {file && (
    <span className={styles.file}>
      📎 {file.name}
    </span>
  )}

  <button
    className={styles.button}
    onClick={onSend}
  >
    Send
  </button>

</div>
  )
}