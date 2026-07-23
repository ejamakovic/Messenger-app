import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import PostCard from "../../components/PostCard/PostCard";
import TopMenu from "../../components/TopMenu/TopMenu";
import { getPost } from "../../services/post.service";
import type { Post } from "../../models/post";

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);

  
  useEffect(() => { getPost(Number(postId)).then(setPost).catch(console.error); }, [postId]);
  if (!user || !post) return <div>Učitavanje...</div>;
  return (
    <div className={styles.masterWrapper}>
      <TopMenu
              user={user}
              conversations={conversations}
              notifications={notifications}
              onNotificationRead={(targetId) => {
                setNotifications((prev) =>
                  prev.map((n) => (n.id === targetId ? { ...n, status: "OPENED" } : n))
                );
              }}
              onNotificationRemove={(targetId) => {
                setNotifications((prev) => prev.filter((n) => n.id !== targetId));
              }}
            />
      <div className={styles.container}>
        <PostCard post={post} currentUser={user} isOwner={user.id === post.authorId} />
      </div>
    </div>
  );
}