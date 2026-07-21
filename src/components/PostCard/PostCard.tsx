import { useState, useEffect, useRef } from "react";
import {
  MoreVertical,
  Trash2,
  Lock,
  Globe2,
  Users as UsersIcon,
  Pencil,
  Check,
  X,
  ChevronRight,
  Eye,
} from "lucide-react";
import styles from "./PostCard.module.css";
import type { Post, PostPrivacy } from "../../models/post";
import SecureImage from "../SecureImage/SecureImage";

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
  const [showPrivacyOptions, setShowPrivacyOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setShowPrivacyOptions(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleSaveEdit = () => {
    if (draft.trim().length === 0) return;
    onEdit?.(post.id, draft.trim());
    setIsEditing(false);
  };

  const closeAllMenus = () => {
    setMenuOpen(false);
    setShowPrivacyOptions(false);
  };

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <span className={styles.postDate}>{new Date(post.createdAt).toLocaleString()}</span>

        {isOwner && (
          <div className={styles.postMenuWrapper} ref={menuRef}>
            <button
              className={styles.postMenuBtn}
              onClick={() => {
                setMenuOpen((v) => !v);
                setShowPrivacyOptions(false);
              }}
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className={styles.postMenuPopover}>
                {!showPrivacyOptions ? (
                  <>
                    <button
                      className={styles.postMenuItem}
                      onClick={() => {
                        setIsEditing(true);
                        closeAllMenus();
                      }}
                    >
                      <Pencil size={14} /> Uredi sadrzaj
                    </button>

                    <button
                      className={styles.postMenuItem}
                      onClick={() => setShowPrivacyOptions(true)}
                    >
                      <Eye size={14} /> Promijeni vidljivost <ChevronRight size={14} style={{ marginLeft: "auto" }} />
                    </button>

                    <div className={styles.postMenuDivider} />

                    <button
                      className={`${styles.postMenuItem} ${styles.postMenuDanger}`}
                      onClick={() => {
                        onDelete?.(post.id);
                        closeAllMenus();
                      }}
                    >
                      <Trash2 size={14} /> Obriši
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={styles.postMenuItem}
                      onClick={() => setShowPrivacyOptions(false)}
                      style={{ opacity: 0.7 }}
                    >
                      ← Natrag
                    </button>
                    <div className={styles.postMenuDivider} />
                    {(["PUBLIC", "FRIENDS", "PRIVATE"] as PostPrivacy[]).map((p) => (
                      <button
                        key={p}
                        className={`${styles.postMenuItem} ${
                          post.privacy === p ? styles.postMenuItemActive : ""
                        }`}
                        onClick={() => {
                          onPrivacyChange?.(post.id, p);
                          closeAllMenus();
                        }}
                      >
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
              onClick={() => {
                setIsEditing(false);
                setDraft(post.content);
              }}
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
          <SecureImage src={post.imageUrl} alt="Post" className={styles.postImage} />
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