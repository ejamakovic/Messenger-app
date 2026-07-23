// src/components/Chat/Chat.tsx
import styles from "./Chat.module.css";
import type { Message } from "../../models/message";
import type { UserModel } from "../../models/user";
import type { Conversation } from "../../models/conversation";
import type { MessageReaction } from "../../models/messageReaction";
import { useState, useEffect, useMemo, useRef } from "react";
import { Settings, Reply, Pencil, Trash2, SmilePlus, Check, X } from "lucide-react";
import { fetchSecureAttachmentBlob, buildAttachmentUrl, buildAvatarUrl } from "../../services/attachments.service";
import { getReactions, getAvailableEmojis } from "../../services/reaction.service";
import { subscribe, unsubscribe } from "../../services/socket.service";
import SecureImage from "../SecureImage/SecureImage";
import ChatSettingsModal from "../ChatSettings/ChatSettingsModal";

type Props = {
  currentUser: UserModel;
  conversation: Conversation | null;
  isPublic: boolean;
  messages: Message[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  isAtBottom: boolean;
  scrollToBottom: () => void;
  onConversationUpdated: (patch: Partial<Conversation>) => void;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: number, newContent: string) => Promise<void>;
  onDelete?: (messageId: number) => Promise<void>;
};

// ---- helpers -------------------------------------------------------------

/** Deterministic hue from a username, so every person gets a stable "signature ring" color. */
function hueFromName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function formatTime(ts?: string) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const GROUP_WINDOW_MS = 4 * 60 * 1000; // messages within 4 min of the same sender collapse into one block

type Grouped = { key: string; senderUsername: string; sender?: UserModel; items: Message[] }[];

function groupMessages(messages: Message[], currentUsername: string): Grouped {
  const groups: Grouped = [];
  for (const msg of messages) {
    const senderUsername = msg.sender?.username || (msg as any).senderUsername || "Unknown";
    const last = groups[groups.length - 1];
    const lastMsg = last?.items[last.items.length - 1];
    const withinWindow =
      lastMsg?.timestamp && msg.timestamp
        ? Math.abs(new Date(msg.timestamp).getTime() - new Date(lastMsg.timestamp).getTime()) < GROUP_WINDOW_MS
        : false;

    if (last && last.senderUsername === senderUsername && withinWindow) {
      last.items.push(msg);
    } else {
      groups.push({
        key: `grp-${msg.id ?? msg.timestamp}-${senderUsername}`,
        senderUsername,
        sender: msg.sender,
        items: [msg],
      });
    }
  }
  return groups;
}

// ---- avatar ----------------------------------------------------------------

function SignatureAvatar({ user, username, size = 36 }: { user?: UserModel; username: string; size?: number }) {
  const hue = hueFromName(username);
  const ring = `conic-gradient(from 210deg, hsl(${hue} 85% 65%), hsl(${(hue + 60) % 360} 85% 60%), hsl(${hue} 85% 65%))`;
  return (
    <div className={styles.signatureAvatar} style={{ width: size, height: size, background: ring }}>
      <div className={styles.signatureAvatarInner}>
        {user?.avatarUrl ? (
          <img src={buildAvatarUrl(user.avatarUrl)} alt={username} />
        ) : (
          <span style={{ color: `hsl(${hue} 70% 40%)` }}>{username.substring(0, 2).toUpperCase()}</span>
        )}
      </div>
    </div>
  );
}

// ---- secure video (unchanged) ----------------------------------------------

function SecureVideo({ src, ...props }: React.VideoHTMLAttributes<HTMLVideoElement> & { src: string }) {
  const [videoSrc, setVideoSrc] = useState("");
  useEffect(() => {
    let objectUrl = "";
    fetchSecureAttachmentBlob(src).then((localUrl) => {
      if (localUrl.startsWith("blob:") && localUrl !== src) objectUrl = localUrl;
      setVideoSrc(localUrl);
    }).catch((err) => console.error("Failed to load secure video:", err));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src]);
  if (!videoSrc) return <div className={styles.mediaPlaceholder}>Loading…</div>;
  return <video src={videoSrc} {...props} />;
}

type PreviewState = { url: string; type: "image" | "video" } | null;

// ---- reaction chip row -------------------------------------------------

function ReactionChips({
  reactions,
  currentUserId,
  availableEmojis,
  onToggle,
}: {
  reactions: MessageReaction[];
  currentUserId: number;
  availableEmojis: string[];
  onToggle: (emoji: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    if (pickerOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [pickerOpen]);

  const grouped = useMemo(() => {
    const map = new Map<string, MessageReaction[]>();
    for (const r of reactions) map.set(r.emoji, [...(map.get(r.emoji) || []), r]);
    return Array.from(map.entries());
  }, [reactions]);

  if (grouped.length === 0) return null;

  return (
    <div className={styles.chipRow}>
      {grouped.map(([emoji, list]) => {
        const mine = list.some((r) => r.user.id === currentUserId);
        return (
          <div key={emoji} className={styles.chipWrapper}>
            <button
              className={`${styles.chip} ${mine ? styles.chipMine : ""}`}
              onClick={() => onToggle(emoji)}
            >
              <span>{emoji}</span>
              <span className={styles.chipCount}>{list.length}</span>
            </button>
            <div className={styles.chipTooltip}>
              {list.map((r) => <div key={r.user.id}>@{r.user.username}</div>)}
            </div>
          </div>
        );
      })}
      <div className={styles.chipAddWrapper} ref={pickerRef}>
        <button className={styles.chipAddBtn} onClick={() => setPickerOpen((v) => !v)}>
          <SmilePlus size={13} />
        </button>
        {pickerOpen && (
          <div className={styles.chipPicker}>
            {availableEmojis.map((e) => (
              <button key={e} onClick={() => { onToggle(e); setPickerOpen(false); }}>{e}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- main component ----------------------------------------------------

export default function Chat({
  currentUser, conversation, isPublic, messages,
  containerRef, onScroll, isAtBottom, scrollToBottom,
  onConversationUpdated, onReply, onEdit, onDelete,
}: Props) {
  const [preview, setPreview] = useState<PreviewState>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [reactionsByMessage, setReactionsByMessage] = useState<Record<number, MessageReaction[]>>({});
  const [availableEmojis, setAvailableEmojis] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);


  useEffect(() => {
      const close = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (!target.closest(`.${styles.messageMenu}`)) {
              setMenuOpenId(null);
          }
      };

      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
  }, [styles.messageMenu])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") { setPreview(null); setEditingId(null); } };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    getAvailableEmojis().then(setAvailableEmojis).catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const initial: Record<number, MessageReaction[]> = {};
    const toFetch: number[] = [];
    messages.forEach((msg) => {
      if (msg.id == null) return;
      if (msg.messageReactions) initial[msg.id] = msg.messageReactions;
      else if (reactionsByMessage[msg.id] === undefined) toFetch.push(msg.id);
    });
    if (Object.keys(initial).length > 0) setReactionsByMessage((prev) => ({ ...prev, ...initial }));
    toFetch.forEach((id) => {
      getReactions(id).then((data) => setReactionsByMessage((prev) => ({ ...prev, [id]: data }))).catch((err) => console.error(err));
    });
  }, [messages]);

  useEffect(() => {
    const handleReactionAdded = (payload: MessageReaction) => {
      setReactionsByMessage((prev) => {
        const existing = prev[payload.messageId] || [];
        const withoutThisUser = existing.filter((r) => r.user.id !== payload.user.id);
        return { ...prev, [payload.messageId]: [...withoutThisUser, payload] };
      });
    };
    const handleReactionRemoved = (payload: { messageId: number; userId: number; emoji: string }) => {
      setReactionsByMessage((prev) => {
        const existing = prev[payload.messageId];
        if (!existing) return prev;
        return { ...prev, [payload.messageId]: existing.filter((r) => !(r.user.id === payload.userId && r.emoji === payload.emoji)) };
      });
    };
    subscribe("reaction_added", handleReactionAdded);
    subscribe("reaction_removed", handleReactionRemoved);
    return () => {
      unsubscribe("reaction_added", handleReactionAdded);
      unsubscribe("reaction_removed", handleReactionRemoved);
    };
  }, []);

  const toggleReaction = async (messageId: number, emoji: string) => {
    try {
      const { setReaction } = await import("../../services/reaction.service");
      await setReaction(messageId, emoji);
    } catch (err) { console.error("Failed to toggle reaction:", err); }
  };

  const handleDownload = async (url: string) => {
    try {
      const downloadUrl = await fetchSecureAttachmentBlob(url);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", url.split("/").pop() || "download-asset");
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (downloadUrl.startsWith("blob:") && downloadUrl !== url) URL.revokeObjectURL(downloadUrl);
    } catch (err) { console.error("Failed download:", err); }
  };

  const startEdit = (msg: Message) => {
    setMenuOpenId(null);
    setEditingId(msg.id);
    setEditDraft(msg.content || "");
  };

  const submitEdit = async (msg: Message) => {
    if (!onEdit || !editDraft.trim()) return;
    await onEdit(msg.id, editDraft.trim());
    setEditingId(null);
  };

  const groups = useMemo(() => groupMessages(messages, currentUser.username), [messages, currentUser.username]);

  return (
    <>
      <div className={styles.chatWrapper}>
        <div
          className={styles.activeChannelBanner}
          onClick={() => !isPublic && conversation && setShowSettings(true)}
          style={{ cursor: !isPublic && conversation ? "pointer" : "default" }}
        >
          {!isPublic && conversation ? (
            <span><strong>@{conversation.name || "…"}</strong></span>
          ) : (
            <span>🌐 Public Global Chatroom</span>
          )}
          {!isPublic && conversation && <Settings size={16} style={{ marginLeft: "auto" }} />}
        </div>

        <div ref={containerRef} onScroll={onScroll} className={styles.chatContainer}>
          {groups.map((group) => {
            const isMine = group.senderUsername === currentUser.username;
            return (
              <div key={group.key} className={`${styles.group} ${isMine ? styles.groupMine : styles.groupTheirs}`}>
                {!isMine && (
                  <div className={styles.groupAvatarSlot}>
                    <SignatureAvatar user={group.sender} username={group.senderUsername} />
                  </div>
                )}

                <div className={styles.groupBody}>
                  {!isMine && <div className={styles.groupName} style={{ color: `hsl(${hueFromName(group.senderUsername)} 70% 45%)` }}>
                    @{group.senderUsername}
                  </div>}

                  {group.items.map((msg, i) => {
                    const isFirst = i === 0;
                    const isLast = i === group.items.length - 1;
                    const shape = isFirst && isLast ? "solo" : isFirst ? "first" : isLast ? "last" : "mid";
                    const reactions = msg.id ? reactionsByMessage[msg.id] || [] : [];
                    const isEditing = editingId === msg.id;
                    const isDeleted = (msg as any).isDeleted;

                    return (
                      <div
                        key={msg.id ?? `pending-${msg.timestamp}-${i}`}
                        className={styles.msgRow}
                        data-message-id={msg.id}
                      >
                        <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs} ${styles["shape_" + shape]} ${isDeleted ? styles.bubbleDeleted : ""}`}>

                          {(msg as any).replyTo && (
                            <div className={styles.replyQuote}>
                              <span className={styles.replyQuoteName}>@{(msg as any).replyTo.senderUsername}</span>
                              <span className={styles.replyQuoteText}>{(msg as any).replyTo.content}</span>
                            </div>
                          )}

                          {isDeleted ? (
                            <div className={styles.deletedText}><Trash2 size={12} /> Poruka je obrisana</div>
                          ) : isEditing ? (
                            <div className={styles.editArea}>
                              <input
                                autoFocus
                                className={styles.editInput}
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") submitEdit(msg);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                              <button className={styles.editIconBtn} onClick={() => submitEdit(msg)}><Check size={14} /></button>
                              <button className={styles.editIconBtn} onClick={() => setEditingId(null)}><X size={14} /></button>
                            </div>
                          ) : (
                            <>
                              {msg.content && <div className={styles.content}>{msg.content}</div>}
                              {(msg as any).editedAt && <span className={styles.editedTag}>(izmijenjeno)</span>}
                            </>
                          )}

                          {!isDeleted && msg.attachments?.map((att, attIndex) => {
                            const isImage = att.fileType?.startsWith("image/");
                            const isVideo = att.fileType?.startsWith("video/");
                            const fileUrl = buildAttachmentUrl(att);
                            return (
                              <div key={att.id ?? `att-${attIndex}`} className={styles.mediaWrapper}>
                                {isImage && (
                                  <SecureImage src={fileUrl} className={styles.image}
                                    onClick={() => setPreview({ url: fileUrl, type: "image" })} loading="lazy" />
                                )}
                                {isVideo && (
                                  <div className={styles.videoThumbnailContainer} onClick={() => setPreview({ url: fileUrl, type: "video" })}>
                                    <SecureVideo src={fileUrl} className={styles.videoThumbnail} />
                                    <div className={styles.playButtonOverlay}>▶</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <span className={styles.hoverTime}>{formatTime(msg.timestamp)}</span>

                          {!isDeleted && (
                          <div
                            className={`${styles.hoverActions} ${menuOpenId === msg.id ? styles.hoverActionsOpen : ""}`}
                          >
                            <button title="Odgovori" onClick={() => onReply?.(msg)}>
                              <Reply size={13} />
                            </button>

                            {isMine && (
                              <div className={styles.messageMenu}>
                                <button
                                  className={styles.menuTrigger}
                                  onClick={() => setMenuOpenId(menuOpenId === msg.id ? null : msg.id)}
                                >
                                  ⋯
                                </button>

                                {menuOpenId === msg.id && (
                                  <div className={styles.menuDropdown}>
                                    <button onClick={() => startEdit(msg)}>
                                      <Pencil size={13} />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        setMenuOpenId(null);
                                        onDelete?.(msg.id);
                                      }}
                                    >
                                      <Trash2 size={13} />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                          {!isDeleted && msg.id && (
                            <ReactionChips
                              reactions={reactions}
                              currentUserId={currentUser.id}
                              availableEmojis={availableEmojis}
                              onToggle={(emoji) => toggleReaction(msg.id, emoji)}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {!isAtBottom && (
          <button type="button" className={styles.scrollToBottomBtn} onClick={scrollToBottom}>↓ Novo</button>
        )}
      </div>

      {preview && (
        <div className={styles.imageOverlay} onClick={() => setPreview(null)}>
          <div className={styles.overlayHeader} onClick={(e) => e.stopPropagation()}>
            <button className={styles.downloadButton} onClick={() => handleDownload(preview.url)}>💾 Sačuvaj</button>
            <button className={styles.closeButton} onClick={() => setPreview(null)}>&times;</button>
          </div>
          <div className={styles.previewContent} onClick={(e) => e.stopPropagation()}>
            {preview.type === "image" ? (
              <SecureImage src={preview.url} className={styles.previewMedia} />
            ) : (
              <SecureVideo controls autoPlay className={styles.previewMedia} playsInline src={preview.url} />
            )}
          </div>
        </div>
      )}

      {showSettings && conversation && (
        <ChatSettingsModal
          conversation={conversation}
          currentUserId={currentUser.id}
          onClose={() => setShowSettings(false)}
          onUpdated={onConversationUpdated}
        />
      )}
    </>
  );
}