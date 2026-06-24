// Chat.tsx
import styles from "./Chat.module.css";
import type { Message } from "../../models/message";
import type { UserModel } from "../../models/user";
import { useState, useEffect } from "react";
import { fetchSecureAttachmentBlob, buildAttachmentUrl } from "../../services/attachments.service";

type Props = {
  currentUser: UserModel;
  messages: Message[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
};

interface SecureMediaProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string; // Force src to be a required string
}

// ── SECURE IMAGE HELPER ──
function SecureImage({ src, ...props }: SecureMediaProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  
  useEffect(() => {
    let objectUrl = "";
    
    fetchSecureAttachmentBlob(src)
      .then((localUrl) => {
        // Track the created url context if it's a freshly minted object blob
        if (localUrl.startsWith("blob:") && localUrl !== src) {
          objectUrl = localUrl;
        }
        setImageSrc(localUrl);
      })
      .catch((err) => console.error("Failed to map secure image source link", err));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!imageSrc) return <div className={styles.mediaPlaceholder}>Loading Image...</div>;
  return <img src={imageSrc} {...props} alt="Secure attachment" />;
}

interface SecureVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string; // Force src to be a required string
}

// ── SECURE VIDEO HELPER ──
function SecureVideo({ src, ...props }: SecureVideoProps) {
  const [videoSrc, setVideoSrc] = useState<string>("");
  
  useEffect(() => {
    let objectUrl = "";

    fetchSecureAttachmentBlob(src)
      .then((localUrl) => {
        if (localUrl.startsWith("blob:") && localUrl !== src) {
          objectUrl = localUrl;
        }
        setVideoSrc(localUrl);
      })
      .catch((err) => console.error("Failed to map secure video source link", err));

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
// Add this definition right here:
type PreviewState = { url: string; type: "image" | "video" } | null;

// ── MAIN PUBLIC CHAT COMPONENT ──
export default function PublicChat({ currentUser, messages, containerRef, onScroll }: Props) {
  const [preview, setPreview] = useState<PreviewState>(null);
  
  // SECURE DOWNLOAD HANDLER
  const handleDownload = async (url: string) => {
    try {
      const downloadUrl = await fetchSecureAttachmentBlob(url);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', url.split('/').pop() || 'download-asset');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the temporary download blob if we generated a new one
      if (downloadUrl.startsWith("blob:") && downloadUrl !== url) {
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (err) {
      console.error("Failed executing secure download channel", err);
    }
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

                  // Built via the cleaner decoupled structural rules
                  const fileUrl = buildAttachmentUrl(att);

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