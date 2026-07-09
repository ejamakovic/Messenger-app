import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ProfilePage.module.css";
import TopMenu from "../../components/TopMenu/TopMenu";
import PostCard from "../../components/PostCard/PostCard";
import { useAuth } from "../../context/AuthContext";
import { getUserProfile } from "../../services/profile.service";
import { getUserPosts, deletePost, updatePost } from "../../services/post.service";
import { getUserConversations, getOrCreatePrivateConversation } from "../../services/conversation.service";
import { sendFriendRequest } from "../../services/friendship.service";
import { getNotifications } from "../../services/notification.service";
import type { UserModel } from "../../models/user";
import type { Post, PostPrivacy } from "../../models/post";
import type { ConversationListDto } from "../../models/conversationListDto";
import type { NotificationDto } from "../../models/notification";
import { MessageSquare, UserPlus, ArrowLeft, Settings } from "lucide-react";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState<UserModel | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [conversations, setConversations] = useState<ConversationListDto[]>([]);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const targetId = Number(userId);
  const isOwnProfile = user?.id === targetId;

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setPageLoading(true);
    try {
      const [profile, userPosts, convs, notifs] = await Promise.all([
        getUserProfile(targetId),
        getUserPosts(targetId),
        getUserConversations(user.id),
        getNotifications(user.id),
      ]);

      setProfileUser(profile);
      setPosts(userPosts.content);
      setConversations(convs.content || []);
      setNotifications(notifs);
    } catch (err) {
      console.error("Failed to load profile page data:", err);
    } finally {
      setPageLoading(false);
    }
  }, [targetId, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleStartChat = async () => {
    if (!user || !profileUser) return;
    try {
      const conv = await getOrCreatePrivateConversation(user.id, profileUser.id);
      navigate(`/chat/conversation/${conv.id}`);
    } catch (err) {
      console.error("Failed to start chat from profile:", err);
    }
  };

  const handleAddFriend = async () => {
    if (!user || !profileUser) return;
    try {
      await sendFriendRequest(user.id, profileUser.id);
      alert(`Zahtjev za prijateljstvo poslan korisniku @${profileUser.username}!`);
    } catch (err) {
      console.error("Failed to send friend request from profile:", err);
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

  if (!user || pageLoading || !profileUser) {
    return <div className={styles.appSpinnerView}>Učitavanje profila...</div>;
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

        <div className={styles.profileHeader}>
          <div className={styles.avatarLarge}>
            {profileUser.avatarUrl ? (
              <img src={profileUser.avatarUrl} alt={profileUser.username} />
            ) : (
              <span>{profileUser.username.substring(0, 2).toUpperCase()}</span>
            )}
          </div>

          <div className={styles.profileInfo}>
            <h2>@{profileUser.username}</h2>
            {(profileUser.firstName || profileUser.lastName) && (
              <p className={styles.fullName}>
                {profileUser.firstName} {profileUser.lastName}
              </p>
            )}
            {profileUser.bio && <p className={styles.bio}>{profileUser.bio}</p>}
          </div>

          <div className={styles.profileActions}>
            {isOwnProfile ? (
              <button className={styles.primaryActionBtn} onClick={() => navigate("/profile/edit")}>
                <Settings size={15} /> Uredi profil
              </button>
            ) : (
              <>
                <button className={styles.primaryActionBtn} onClick={handleStartChat}>
                  <MessageSquare size={15} /> Pošalji poruku
                </button>
                <button className={styles.secondaryActionBtn} onClick={handleAddFriend}>
                  <UserPlus size={15} /> Dodaj prijatelja
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.postsSection}>
          <h3 className={styles.postsSectionTitle}>Objave</h3>
          {posts.length === 0 ? (
            <div className={styles.emptyPosts}>Još nema objava.</div>
          ) : (
            <div className={styles.postsList}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isOwner={isOwnProfile}
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