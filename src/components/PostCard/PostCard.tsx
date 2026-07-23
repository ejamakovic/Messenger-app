import { useState, useEffect, useRef } from "react";
import {
  MoreVertical, Trash2, Lock, Globe2, Users as UsersIcon, Pencil, Check, X, ChevronRight, Eye, MessageCircle,
} from "lucide-react";
import styles from "./PostCard.module.css";
import type { Post, PostPrivacy } from "../../models/post";
import type { UserModel } from "../../models/user";
import SecureImage from "../SecureImage/SecureImage";
import PostReactions from "../PostReactions/PostReactions";
import PostComments from "../PostComments/PostComments";
import { getAvailableEmojis } from "../../services/reaction.service";
import { fetchSecureAttachmentBlob } from "../../services/attachments.service";

type Props = {
  post: Post;
  currentUser: UserModel;
  isOwner: boolean;
  onDelete?: (id: number) => void;
  onEdit?: (id: number, content: string) => void;
  onPrivacyChange?: (id: number, privacy: PostPrivacy) => void;
};

const privacyIcons: Record<PostPrivacy, React.ReactNode> = {
  PUBLIC: <Globe2 size={13} />,
  FRIENDS: <UsersIcon size={13} />,
  PRIVATE: <Lock size={13} />,
};

const privacyLabels: Record<PostPrivacy, string> = {
  PUBLIC: "Javno",
  FRIENDS: "Prijatelji",
  PRIVATE: "Privatno",
};

function PostMediaItem({ url, fileType }: { url: string; fileType?: string }) {
  const isVideo = fileType?.startsWith("video/");
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!isVideo) return;
    let obj = "";
    fetchSecureAttachmentBlob(url).then((s) => {
      if (s.startsWith("blob:") && s !== url) obj = s;
      setSrc(s);
    });
    return () => { if (obj) URL.revokeObjectURL(obj); };
  }, [url, isVideo]);

  if (isVideo) return src ? <video src={src} controls className={styles.postImage} /> : null;
  return <SecureImage src={url} alt="Post media" className={styles.postImage} />;
}

export default function PostCard({ post, currentUser, isOwner, onDelete, onEdit, onPrivacyChange }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPrivacyOptions, setShowPrivacyOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [emojis, setEmojis] = useState<string[]>([]);
  const [reactionState, setReactionState] = useState({ counts: post.reactionCounts, mine: post.myReaction ?? null });
  const [commentCount, setCommentCount] = useState(post.commentCount);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { getAvailableEmojis().then(setEmojis).catch(() => {}); }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setShowPrivacyOptions(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleSaveEdit = () => {
    if (draft.trim().length === 0) return;
    onEdit?.(post.id, draft.trim());
    setIsEditing(false);
  };

  const closeAllMenus = () => { setMenuOpen(false); setShowPrivacyOptions(false); };

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <div className={styles.postHeaderInfo}>
          {!isOwner && <span className={styles.postAuthor}>@{post.authorUsername}</span>}
          <span className={styles.postDate}>{new Date(post.createdAt).toLocaleString()}</span>
        </div>

        {isOwner && (
          <div className={styles.postMenuWrapper} ref={menuRef}>
            <button className={styles.postMenuBtn} onClick={() => { setMenuOpen((v) => !v); setShowPrivacyOptions(false); }}>
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className={styles.postMenuPopover}>
                {!showPrivacyOptions ? (
                  <>
                    <button className={styles.postMenuItem} onClick={() => { setIsEditing(true); closeAllMenus(); }}>
                      <Pencil size={14} /> Uredi sadrzaj
                    </button>
                    <button className={styles.postMenuItem} onClick={() => setShowPrivacyOptions(true)}>
                      <Eye size={14} /> Promijeni vidljivost <ChevronRight size={14} style={{ marginLeft: "auto" }} />
                    </button>
                    <div className={styles.postMenuDivider} />
                    <button className={`${styles.postMenuItem} ${styles.postMenuDanger}`} onClick={() => { onDelete?.(post.id); closeAllMenus(); }}>
                      <Trash2 size={14} /> Obriši
                    </button>
                  </>
                ) : (
                  <>
                    <button className={styles.postMenuItem} onClick={() => setShowPrivacyOptions(false)} style={{ opacity: 0.7 }}>← Natrag</button>
                    <div className={styles.postMenuDivider} />
                    {(["PUBLIC", "FRIENDS", "PRIVATE"] as PostPrivacy[]).map((p) => (
                      <button key={p} className={styles.postMenuItem} onClick={() => { onPrivacyChange?.(post.id, p); closeAllMenus(); }}>
                        {privacyIcons[p]} {privacyLabels[p]}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className={styles.editArea}>
          <textarea className={styles.editTextarea} value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />
          <div className={styles.editActions}>
            <button className={styles.editSaveBtn} onClick={handleSaveEdit}><Check size={14} /> Spremi</button>
            <button className={styles.editCancelBtn} onClick={() => { setIsEditing(false); setDraft(post.content); }}>
              <X size={14} /> Odustani
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.postContent}>{post.content}</p>
      )}

      {post.media?.length > 0 && (
        <div className={`${styles.postMediaGrid} ${post.media.length === 1 ? styles.singleMedia : ""}`}>
          {post.media.map((m) => (
            <div key={m.id} className={styles.postImageWrapper}>
              <PostMediaItem url={m.url} fileType={m.fileType} />
            </div>
          ))}
        </div>
      )}

      <div className={styles.postFooter}>
        {isOwner && (
          <div className={styles.privacyBadge}>
            {privacyIcons[post.privacy]} <span>{privacyLabels[post.privacy]}</span>
          </div>
        )}

        <PostReactions
          postId={post.id}
          currentUserId={currentUser.id}
          reactionCounts={reactionState.counts}
          myReaction={reactionState.mine}
          availableEmojis={emojis}
          onChanged={(counts, mine) => setReactionState({ counts, mine })}
        />

        <button className={styles.commentsToggleBtn} onClick={() => setShowComments((v) => !v)}>
          <MessageCircle size={14} /> {commentCount} komentara
        </button>
      </div>

      {showComments && (
      <PostComments
        postId={post.id}
        currentUser={currentUser}
        onCommentAdded={() => setCommentCount((c) => c + 1)}
        onCommentDeleted={() => setCommentCount((c) => Math.max(c - 1, 0))}
      />
    )}
    </div>
  );
}