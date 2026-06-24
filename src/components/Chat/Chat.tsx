// Chat.ts
import styles from "./Chat.module.css";
import type { Message } from "../../models/message";
import type { UserModel } from "../../models/user";
import { API_URL } from "../../services/api";
import { useState, useEffect } from "react";
import axios from "axios";

type Props = {
  currentUser: UserModel;
  messages: Message[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
};

type PreviewState = { url: string; type: "image" | "video" } | null;

// ── SECURE IMAGE HELPER ──
function SecureImage({ src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [imageSrc, setImageSrc] = useState<string>("");

  useEffect(() => {
    if (!src) return;
    // For pending/blob/data URLs, skip axios fetch
    if (src.startsWith("blob:") || src.startsWith("data:")) {
      setImageSrc(src);
      return;
    }

    let objectUrl = "";
    axios.get(src, { responseType: "blob" })
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data);
        setImageSrc(objectUrl);
      })
      .catch((err) => console.error("Failed to load secure image", err));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!imageSrc) return <div className={styles.mediaPlaceholder}>Loading Image...</div>;
  return <img src={imageSrc} {...props} alt="Secure attachment" />;
}

// ── SECURE VIDEO HELPER ──
function SecureVideo({ src, ...props }: React.VideoHTMLAttributes<HTMLVideoElement>) {
  const [videoSrc, setVideoSrc] = useState<string>("");

  useEffect(() => {
    if (!src) return;
    if (src.startsWith("blob:") || src.startsWith("data:")) {
      setVideoSrc(src);
      return;
    }

    let objectUrl = "";
    axios.get(src, { responseType: "blob" })
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data);
        setVideoSrc(objectUrl);
      })
      .catch((err) => console.error("Failed to load secure video", err));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!videoSrc) return <div className={styles.mediaPlaceholder}>Loading Video...</div>;
  return (
    <video src={videoSrc} {...props}>
      Your browser does not support the video tag.
    </video>
  );
}

// ── MAIN PUBLIC CHAT COMPONENT ──
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
                  const attKey = att.id ? `att-${att.id}` : `att-fallback-${attIndex}`;

                  // Target the secure controller path explicitly with /api
                  const fileUrl = att.id 
                    ? `${API_URL}/attachments/${att.id}`
                    : att.fileUrl.startsWith('http') || att.fileUrl.startsWith('data:') || att.fileUrl.startsWith('blob:')
                      ? att.fileUrl 
                      : `${API_URL}${att.fileUrl}`;

                  return (
                    <div key={attKey} className={styles.mediaWrapper}>
                      {isImage && (
                        <SecureImage
                          src={fileUrl}
                          className={styles.image}
                          onClick={() => setPreview({ url: fileUrl, type: "image" })}
                          loading="lazy"
                        />
                      )}
                      {isVideo && (
                        <div 
                          className={styles.videoThumbnailContainer}
                          onClick={() => setPreview({ url: fileUrl, type: "video" })}
                        >
                          <SecureVideo src={fileUrl} className={styles.videoThumbnail} />
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
              <SecureImage src={preview.url} className={styles.previewMedia} />
            ) : (
              <SecureVideo 
                controls 
                autoPlay 
                className={styles.previewMedia}                
                playsInline 
                src={preview.url}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}