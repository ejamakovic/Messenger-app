import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./EditProfilePage.module.css";
import TopMenu from "../../components/TopMenu/TopMenu";
import PostCard from "../../components/PostCard/PostCard";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, uploadAvatar } from "../../services/profile.service";
import { getUserPosts, createPost, deletePost, updatePost } from "../../services/post.service";
import { getUserConversations } from "../../services/conversation.service";
import { getNotifications } from "../../services/notification.service";
import type { Post, PostPrivacy } from "../../models/post";
import type { ConversationListDto } from "../../models/conversationListDto";
import type { NotificationDto } from "../../models/notification";
import { Camera, ImagePlus, ArrowLeft } from "lucide-react";

export default function EditProfilePage() {
  const { user, token, saveSession } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostPrivacy, setNewPostPrivacy] = useState<PostPrivacy>("PUBLIC");
  const [newPostImage, setNewPostImage] = useState<File | null>(null);

  const [conversations, setConversations] = useState<ConversationListDto[]>([]);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setPageLoading(true);
    try {
      const [userPosts, convs, notifs] = await Promise.all([
        getUserPosts(user.id),
        getUserConversations(user.id),
        getNotifications(user.id),
      ]);
      setPosts(userPosts.content);
      setConversations(convs.content || []);
      setNotifications(notifs);
    } catch (err) {
      console.error("Failed to load edit profile data:", err);
    } finally {
      setPageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl = user.avatarUrl;

      if (avatarFile) {
        const res = await uploadAvatar(user.id, avatarFile);
        avatarUrl = res.avatarUrl;
      }

      const updated = await updateProfile(user.id, {
        firstName,
        lastName,
        email,
        bio,
        avatarUrl,
      });

      saveSession(updated, token ?? "");
      alert("Profil je uspješno ažuriran.");
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Greška prilikom spremanja profila.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user || newPostContent.trim().length === 0) return;
    try {
      const post = await createPost(user.id, newPostContent.trim(), newPostPrivacy, newPostImage || undefined);
      setPosts((prev) => [post, ...prev]);
      setNewPostContent("");
      setNewPostImage(null);
      setNewPostPrivacy("PUBLIC");
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("Jeste li sigurni da želite obrisati objavu?")) return;
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleEditPost = async (postId: number, content: string) => {
    try {
      const updated = await updatePost(postId, { content });
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    } catch (err) {
      console.error("Failed to edit post:", err);
    }
  };

  const handlePrivacyChange = async (postId: number, privacy: PostPrivacy) => {
    try {
      const updated = await updatePost(postId, { privacy });
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    } catch (err) {
      console.error("Failed to change post privacy:", err);
    }
  };

  if (!user || pageLoading) {
    return <div className={styles.appSpinnerView}>Učitavanje...</div>;
  }

  return (
    <div className={styles.masterWrapper}>
      <TopMenu
        user={user}
        conversations={conversations}
        notifications={notifications}
        onNotificationRead={(id) =>
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: "OPENED" } : n)))
        }
        onNotificationRemove={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      />

      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Nazad
        </button>

        <div className={styles.editCard}>
          <h2>Uredi profil</h2>

          <div className={styles.avatarEditRow}>
            <div className={styles.avatarLarge}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                <span>{user.username.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className={styles.hiddenFileInput}
              onChange={handleAvatarPick}
            />
            <button className={styles.changeAvatarBtn} onClick={() => fileInputRef.current?.click()}>
              <Camera size={14} /> Promijeni sliku
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label>Korisničko ime</label>
            <input type="text" value={user.username} disabled />
          </div>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label>Ime</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className={styles.inputGroup}>
              <label>Prezime</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label>Biografija</label>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Spremanje..." : "Spremi promjene"}
          </button>
        </div>

        <div className={styles.postComposer}>
          <h3>Nova objava</h3>
          <textarea
            rows={3}
            placeholder="Šta ti je na umu?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />

          <div className={styles.composerControls}>
            <select value={newPostPrivacy} onChange={(e) => setNewPostPrivacy(e.target.value as PostPrivacy)}>
              <option value="PUBLIC">Javno</option>
              <option value="FRIENDS">Prijatelji</option>
              <option value="PRIVATE">Privatno</option>
            </select>

            <input
              type="file"
              accept="image/*"
              ref={postImageInputRef}
              className={styles.hiddenFileInput}
              onChange={(e) => setNewPostImage(e.target.files?.[0] || null)}
            />
            <button className={styles.attachImageBtn} onClick={() => postImageInputRef.current?.click()}>
              <ImagePlus size={16} />
            </button>

            <button className={styles.postSubmitBtn} onClick={handleCreatePost}>
              Objavi
            </button>
          </div>

          {newPostImage && <span className={styles.selectedFileName}>{newPostImage.name}</span>}
        </div>

        <div className={styles.postsSection}>
          <h3 className={styles.postsSectionTitle}>Tvoje objave</h3>
          {posts.length === 0 ? (
            <div className={styles.emptyPosts}>Još nema objava.</div>
          ) : (
            <div className={styles.postsList}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isOwner
                  onDelete={handleDeletePost}
                  onEdit={handleEditPost}
                  onPrivacyChange={handlePrivacyChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}