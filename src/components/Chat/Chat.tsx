import styles from "./Chat.module.css";
import type { Message } from "../../models/message";
import type { UserModel } from "../../models/user";
import { API_URL } from "../../services/api";
import { useState, useEffect } from "react";

type Props = {
  currentUser: UserModel;
  messages: Message[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
};

type PreviewState = { url: string; type: "image" | "video" } | null;

export default function PublicChat({ currentUser, messages, containerRef, onScroll }: Props) {
  const [preview, setPreview] = useState<PreviewState>(null);
  
  // DOWNLOAD LOGIC
  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', url.split('/').pop() || 'file');
    link.target = "_blank"; 
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      <div ref={containerRef} onScroll={onScroll} className={styles.chatContainer}>
        {messages.map((msg, index) => {
          const senderUsername = msg.sender?.username || (msg as any).senderUsername;
          const isMine = senderUsername === currentUser.username || msg.sender === currentUser;

          // 🛡️ STABLE KEY GENERATOR FIX:
          // Instead of changing keys from socket -> db id, we build a key that stays identical.
          // If the message has a distinct client timestamp, we prioritize keeping it unified.
          const stableIdentifier = msg.timestamp || index;
          const messageKey = msg.id 
            ? `msg-${msg.id}` 
            : `msg-pending-${stableIdentifier}`;

          return (
            <div key={messageKey} className={isMine ? styles.messageRowMine : styles.messageRowTheirs}>
              <div className={isMine ? styles.bubbleMine : styles.bubbleTheirs}>
                <div className={styles.username}>@{senderUsername || "Unknown"}</div>
                {msg.content && <div className={styles.content}>{msg.content}</div>}

                {msg.attachments?.map((att, attIndex) => {
                  const isImage = att.fileType?.startsWith("image/");
                  const isVideo = att.fileType?.startsWith("video/");
                  const fileUrl = `${API_URL}${att.fileUrl}`;
                  const attKey = att.id ? `att-${att.id}` : `att-fallback-${attIndex}`;

                  return (
                    <div key={attKey} className={styles.mediaWrapper}>
                      {isImage && (
                        <img
                          src={fileUrl}
                          className={styles.image}
                          onClick={() => setPreview({ url: fileUrl, type: "image" })}
                          alt="attachment"
                          loading="lazy"
                        />
                      )}
                      {isVideo && (
                        <div 
                          className={styles.videoThumbnailContainer}
                          onClick={() => setPreview({ url: fileUrl, type: "video" })}
                        >
                          <video className={styles.videoThumbnail}>
                            <source src={fileUrl} type={att.fileType} />
                          </video>
                          <div className={styles.playButtonOverlay}>▶</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    
      {/* UNIFIED MEDIA OVERLAY */}
      {preview && (
        <div className={styles.imageOverlay} onClick={() => setPreview(null)}>
          <div className={styles.overlayHeader} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.downloadButton} 
              onClick={() => handleDownload(preview.url)}
            >
              💾 Save to Device
            </button>
            <button className={styles.closeButton} onClick={() => setPreview(null)}>&times;</button>
          </div>
          
          <div className={styles.previewContent} onClick={(e) => e.stopPropagation()}>
            {preview.type === "image" ? (
              <img src={preview.url} className={styles.previewMedia} alt="Preview" />
            ) : (
              <video 
                controls 
                autoPlay 
                className={styles.previewMedia}                
                playsInline 
              >
                <source src={preview.url} />
              </video>
            )}
          </div>
        </div>
      )}
    </>
  );
}