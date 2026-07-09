import { useState } from "react";
import { MoreVertical, Trash2, Lock, Globe2, Users as UsersIcon, Pencil, Check, X } from "lucide-react";
import styles from "./PostCard.module.css";
import type { Post, PostPrivacy } from "../../models/post";

type Props = {
  post: Post;
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

export default function PostCard({ post, isOwner, onDelete, onEdit, onPrivacyChange }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);

  const handleSaveEdit = () => {
    if (draft.trim().length === 0) return;
    onEdit?.(post.id, draft.trim());
    setIsEditing(false);
  };

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <span className={styles.postDate}>{new Date(post.createdAt).toLocaleString()}</span>

        {isOwner && (
          <div className={styles.postMenuWrapper}>
            <button className={styles.postMenuBtn} onClick={() => setMenuOpen((v) => !v)}>
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className={styles.postMenuPopover}>
                <button
                  className={styles.postMenuItem}
                  onClick={() => { setIsEditing(true); setMenuOpen(false); }}
                >
                  <Pencil size={14} /> Uredi
                </button>
                <div className={styles.postMenuDivider} />
                {(["PUBLIC", "FRIENDS", "PRIVATE"] as PostPrivacy[]).map((p) => (
                  <button
                    key={p}
                    className={styles.postMenuItem}
                    onClick={() => { onPrivacyChange?.(post.id, p); setMenuOpen(false); }}
                  >
                    {privacyIcons[p]} {privacyLabels[p]}
                  </button>
                ))}
                <div className={styles.postMenuDivider} />
                <button
                  className={`${styles.postMenuItem} ${styles.postMenuDanger}`}
                  onClick={() => { onDelete?.(post.id); setMenuOpen(false); }}
                >
                  <Trash2 size={14} /> Obriši
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className={styles.editArea}>
          <textarea
            className={styles.editTextarea}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
          />
          <div className={styles.editActions}>
            <button className={styles.editSaveBtn} onClick={handleSaveEdit}>
              <Check size={14} /> Spremi
            </button>
            <button
              className={styles.editCancelBtn}
              onClick={() => { setIsEditing(false); setDraft(post.content); }}
            >
              <X size={14} /> Odustani
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.postContent}>{post.content}</p>
      )}

      {post.imageUrl && (
        <div className={styles.postImageWrapper}>
          <img src={post.imageUrl} alt="Post" className={styles.postImage} />
        </div>
      )}

      {isOwner && (
        <div className={styles.privacyBadge}>
          {privacyIcons[post.privacy]} <span>{privacyLabels[post.privacy]}</span>
        </div>
      )}
    </div>
  );
}