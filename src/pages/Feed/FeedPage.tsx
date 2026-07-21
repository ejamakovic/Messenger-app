import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FeedPage.module.css";
import TopMenu from "../../components/TopMenu/TopMenu";
import PostCard from "../../components/PostCard/PostCard";
import { useAuth } from "../../context/AuthContext";
import { useInbox } from "../../hooks/useInbox";
import { getFeed, deletePost, updatePost } from "../../services/post.service";
import type { Post, PostPrivacy } from "../../models/post";
import { ArrowLeft } from "lucide-react";

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations, notifications, setNotifications } = useInbox(user);

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await getFeed(targetPage, 10);
      setPosts((prev) => (targetPage === 0 ? res.content : [...prev, ...res.content]));
      setHasMore(res.content.length > 0 && (targetPage + 1) * 10 < res.totalElements);
      setPage(targetPage);
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) load(0); }, [user, load]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) load(page + 1);
    }, { threshold: 1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, load]);

  const handleDelete = async (postId: number) => {
    if (!window.confirm("Obrisati objavu?")) return;
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleEdit = async (postId: number, content: string) => {
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

  if (!user) return null;

  return (
    <div className={styles.masterWrapper}>
      <TopMenu
        user={user}
        conversations={conversations}
        notifications={notifications}
        onNotificationRead={(id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: "OPENED" } : n)))}
        onNotificationRemove={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      />

      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Nazad
        </button>

        <h2 className={styles.feedTitle}>Feed</h2>

        {posts.length === 0 && !loading ? (
          <div className={styles.emptyFeed}>Nema objava za prikaz.</div>
        ) : (
          <div className={styles.postsList}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                isOwner={user.id === post.authorId}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrivacyChange={handlePrivacyChange}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className={styles.sentinel} />
        {loading && <div className={styles.loadingMore}>Učitavanje...</div>}
      </div>
    </div>
  );
}