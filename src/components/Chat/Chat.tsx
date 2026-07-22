import styles from "./Chat.module.css";
import type { Message } from "../../models/message";
import type { UserModel } from "../../models/user";
import type { Conversation } from "../../models/conversation";
import type { MessageReaction } from "../../models/messageReaction";
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { fetchSecureAttachmentBlob, buildAttachmentUrl, buildAvatarUrl } from "../../services/attachments.service";
import { getReactions, getAvailableEmojis } from "../../services/reaction.service";
import { subscribe, unsubscribe } from "../../services/socket.service";
import SecureImage from "../SecureImage/SecureImage";
import MessageReactions from "../MessageReaction/MessageReaction";
import ChatSettingsModal from "../ChatSettings/ChatSettingsModal";

type Props = {
  currentUser: UserModel;
  conversation: Conversation | null;
  isPublic: boolean; // true for the global chat — no settings/banner click there
  messages: Message[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  isAtBottom: boolean;
  scrollToBottom: () => void;
  onConversationUpdated: (patch: Partial<Conversation>) => void;
};

interface SecureVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
}

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

type PreviewState = { url: string; type: "image" | "video" } | null;
export default function PublicChat({
  currentUser,
  conversation,
  isPublic,
  messages,
  containerRef,
  onScroll,
  isAtBottom,
  scrollToBottom,
  onConversationUpdated,
}: Props) {
  const [preview, setPreview] = useState<PreviewState>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [reactionsByMessage, setReactionsByMessage] = useState<Record<number, MessageReaction[]>>({});
  const [availableEmojis, setAvailableEmojis] = useState<string[]>([]);

  const handleDownload = async (url: string) => {
    try {
      const downloadUrl = await fetchSecureAttachmentBlob(url);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', url.split('/').pop() || 'download-asset');
      document.body.appendChild(link);
      link.click();
      link.remove();

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

  useEffect(() => {
    getAvailableEmojis()
      .then(setAvailableEmojis)
      .catch((err) => console.error("Failed to load available reactions:", err));
  }, []);

  useEffect(() => {
    const initialReactionsMap: Record<number, MessageReaction[]> = {};
    const idsToFetch: number[] = [];

    messages.forEach((msg) => {
      if (msg.id == null) return;
      if (msg.messageReactions) {
        initialReactionsMap[msg.id] = msg.messageReactions;
      } else if (reactionsByMessage[msg.id] === undefined) {
        idsToFetch.push(msg.id);
      }
    });

    if (Object.keys(initialReactionsMap).length > 0) {
      setReactionsByMessage((prev) => ({ ...prev, ...initialReactionsMap }));
    }

    idsToFetch.forEach((id) => {
      getReactions(id)
        .then((data) => {
          setReactionsByMessage((prev) => ({ ...prev, [id]: data }));
        })
        .catch((err) => console.error(`Failed to load reactions for message ${id}:`, err));
    });
  }, [messages]);

  useEffect(() => {
    const handleReactionAdded = (payload: MessageReaction) => {
      setReactionsByMessage((prev) => {
        const existing = prev[payload.messageId] || [];
        const alreadyThere = existing.some(
          (r) => r.user.id === payload.user.id && r.emoji === payload.emoji
        );
        if (alreadyThere) return prev;
        return { ...prev, [payload.messageId]: [...existing, payload] };
      });
    };

    const handleReactionRemoved = (payload: { messageId: number; userId: number; emoji: string }) => {
      setReactionsByMessage((prev) => {
        const existing = prev[payload.messageId];
        if (!existing) return prev;
        return {
          ...prev,
          [payload.messageId]: existing.filter(
            (r) => !(r.user.id === payload.userId && r.emoji === payload.emoji)
          ),
        };
      });
    };

    subscribe("reaction_added", handleReactionAdded);
    subscribe("reaction_removed", handleReactionRemoved);

    return () => {
      unsubscribe("reaction_added", handleReactionAdded);
      unsubscribe("reaction_removed", handleReactionRemoved);
    };
  }, []);

  return (
    <>
      {/* Structural layout wrapper frame supporting local spatial components */}
      <div className={styles.chatWrapper}>
        <div
          className={styles.activeChannelBanner}
          onClick={() => !isPublic && conversation && setShowSettings(true)}
          style={{ cursor: !isPublic && conversation ? "pointer" : "default" }}
        >
          {!isPublic && conversation ? (
            <span><strong>@{conversation.name || "Loading Context..."}</strong></span>
          ) : (
            <span>🌐 Public Global Chatroom Arena</span>
          )}
          {!isPublic && conversation && (
            <Settings size={16} style={{ marginLeft: "auto" }} />
          )}
        </div>
        <div ref={containerRef} onScroll={onScroll} className={styles.chatContainer}>          
          {messages.map((msg, index) => {
            const senderUsername = msg.sender?.username || (msg as any).senderUsername;
            const isMine = senderUsername === currentUser.username || msg.sender === currentUser;

            const stableIdentifier = msg.timestamp || index;
            const messageKey = msg.id
              ? `msg-${msg.id}`
              : `msg-pending-${stableIdentifier}`;

            return (
              <div key={messageKey} className={isMine ? styles.messageRowMine : styles.messageRowTheirs} data-message-id={msg.id}>
                <div className={styles.messageCol}>

                  <div className={styles.avatarSmall}>
                    {msg.sender?.avatarUrl ? (
                      <img src={buildAvatarUrl(msg.sender.avatarUrl)} alt={senderUsername} />
                    ) : (
                      (senderUsername || "?").substring(0, 2).toUpperCase()
                    )}
                  </div>
                  
                  <div className={isMine ? styles.bubbleMine : styles.bubbleTheirs}>
                    <div className={styles.username}>@{senderUsername || "Unknown"}</div>
                    {msg.content && <div className={styles.content}>{msg.content}</div>}

                    {msg.attachments?.map((att, attIndex) => {
                      const isImage = att.fileType?.startsWith("image/");
                      const isVideo = att.fileType?.startsWith("video/");
                      const attKey = att.id ? `att-${att.id}` : `att-fallback-${attIndex}`;
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
                  
                  {msg.id && (
                    <div className={isMine ? styles.reactionsWrapperMine : styles.reactionsWrapperTheirs}>
                      <MessageReactions
                        messageId={msg.id}
                        currentUserId={currentUser.id}
                        reactions={reactionsByMessage[msg.id] || []}
                        availableEmojis={availableEmojis}
                        alignRight={isMine}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!isAtBottom && (
          <button type="button" className={styles.scrollToBottomBtn} onClick={scrollToBottom} aria-label="Scroll to recent messages">
            ↓
          </button>
        )}
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

      {showSettings && conversation && (
        <ChatSettingsModal
          conversation={conversation}
          currentUserId={currentUser.id}
          onClose={() => setShowSettings(false)}
          onUpdated={(patch) => {
            onConversationUpdated(patch);
          }}
        />
      )}
    </>
  );
}