import styles from "./PublicChat.module.css";
import type { Message } from "../../models/message";
import type { User } from "../../models/user";
import { API_URL } from "../../services/api";
import { useState, useEffect } from "react";

type Props = {
  currentUser: User;
  messages: Message[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
};

type PreviewState = { url: string; type: "image" | "video" } | null;

export default function PublicChat({ currentUser, messages, containerRef, onScroll }: Props) {
  const [preview, setPreview] = useState<PreviewState>(null);
  
  // DOWNLOAD LOGIC
  const handleDownload = (url: string) => {
    // We create a temporary link and simulate a click.
    // Since we aren't using 'fetch', CORS won't block this.
    const link = document.createElement('a');
    link.href = url;
  
    // This tells the browser to try and download it
    link.setAttribute('download', url.split('/').pop() || 'file');
  
    // This ensures it opens in a way that triggers the browser's 
    // native download handler
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
        {messages.map((msg) => {
          const isMine = msg.sender?.username === currentUser.username;

          return (
            <div key={msg.id} className={isMine ? styles.messageRowMine : styles.messageRowTheirs}>
              <div className={isMine ? styles.bubbleMine : styles.bubbleTheirs}>
                <div className={styles.username}>{msg.sender?.username}</div>
                {msg.content && <div className={styles.content}>{msg.content}</div>}

                {msg.attachments?.map((att) => {
                  const isImage = att.fileType?.startsWith("image/");
                  const isVideo = att.fileType?.startsWith("video/");
                  const fileUrl = `${API_URL}${att.fileUrl}`;

                  return (
                    <div key={att.id} className={styles.mediaWrapper}>
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
            {/* Added a Download */}
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