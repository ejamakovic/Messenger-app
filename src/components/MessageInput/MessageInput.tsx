import styles from "../MessageInput/MessageInput.module.css"

export default function MessageInput({
  text,
  files,
  canSend,
  onTextChange,
  onFileSelect,
  onSend
}: any) {
  return (<div className={styles.container}>

<input
  type="file"
  multiple
  accept="image/*,video/*"
onChange={(e) => {

  const files =
    Array.from(e.target.files || []);

  if (files.length === 0) return;

  const maxSize =
    50 * 1024 * 1024; // 50MB

  for (const file of files) {

    const isImage =
      file.type.startsWith("image/");

    const isVideo =
      file.type.startsWith("video/");

    if (!isImage && !isVideo) {

      alert(
        `${file.name} is not supported`
      );

      e.target.value = "";

      return;
    }

    if (file.size > maxSize) {

      alert(
        `${file.name} is too large`
      );

      e.target.value = "";

      return;
    }
  }

  onFileSelect(files);
}}
/>

  <input
    className={styles.input}
    value={text}
    onChange={(e) => onTextChange(e.target.value)}
    onKeyDown={(e) => {
      if (
        e.key === "Enter" &&
        canSend
      ) {

      e.preventDefault();

      onSend();
      }
    }}
    placeholder="Type message..."
  />
  {files?.length > 0 && (
  <div className={styles.fileList}>
    {files.map((file: File) => (
      <span
        key={file.name}
        className={styles.file}
      >
        📎 {file.name}
      </span>
    ))}
  </div>
)}

  <button
    className={styles.button}
    onClick={onSend}
    disabled={!canSend}
  >
    Send
  </button>

</div>
  )
}