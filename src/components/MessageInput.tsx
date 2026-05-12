import styles from "../styles/MessageInput.module.css"

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
    onChange={(e) =>
      onFileSelect(e.target.files?.[0] || null)
    }
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