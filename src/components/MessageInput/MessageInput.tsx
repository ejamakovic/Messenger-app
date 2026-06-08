import { useRef } from "react";
import { Paperclip, SendHorizontal } from "lucide-react";
import styles from "./MessageInput.module.css";

export default function MessageInput({
  text,
  files,
  canSend,
  onTextChange,
  onFileSelect,
  onSend
}: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const maxSize = 50 * 1024 * 1024; // 50MB

    for (const file of selectedFiles) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        alert(`${file.name} is not supported`);
        e.target.value = "";
        return;
      }

      if (file.size > maxSize) {
        alert(`${file.name} is too large`);
        e.target.value = "";
        return;
      }
    }

    onFileSelect(selectedFiles);
  };

  return (
    <div className={styles.outerWrapper}>
      {/* 📎 Selected Files Preview Shelf */}
      {files?.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file: File) => (
            <span key={file.name} className={styles.fileBadge}>
              <Paperclip size={12} />
              <span className={styles.fileName}>{file.name}</span>
            </span>
          ))}
        </div>
      )}

      <div className={styles.container}>
        {/* Hidden Native Input */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*,video/*"
          className={styles.hiddenFileInput}
          onChange={handleFileChange}
        />

        {/* Custom Stylized Attach Button */}
        <button
          type="button"
          className={styles.attachButton}
          onClick={triggerFileSelect}
          title="Attach Media Files"
        >
          <Paperclip size={20} />
        </button>

        {/* Text Area Input Container */}
        <input
          className={styles.input}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSend) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Type message..."
        />

        {/* Action Submit Send Trigger */}
        <button
          className={styles.button}
          onClick={onSend}
          disabled={!canSend}
          title="Send Message"
        >
          <SendHorizontal size={18} />
        </button>
      </div>
    </div>
  );
}