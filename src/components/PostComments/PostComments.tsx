import { useState, useEffect, useCallback } from "react";
import { getComments, getReplies, addComment, deleteComment } from "../../services/comment.service";
import { getAvailableEmojis } from "../../services/reaction.service";
import type { PostCommentDto } from "../../models/postComment";
import type { UserModel } from "../../models/user";
import { buildAvatarUrl } from "../../services/attachments.service";
import CommentReactions from "../CommentReactions/CommentReactions";
import styles from "./PostComments.module.css";

function CommentRow({
  comment, currentUser, emojis, onDeleted,
}: {
  comment: PostCommentDto;
  currentUser: UserModel;
  emojis: string[];
  onDeleted: (id: number) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<PostCommentDto[]>([]);
  const [repliesPage, setRepliesPage] = useState(0);
  const [hasMoreReplies, setHasMoreReplies] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [local, setLocal] = useState(comment);

  const loadReplies = useCallback(async (page: number) => {
    setLoadingReplies(true);
    try {
      const res = await getReplies(comment.id, page, 5);
      setReplies((prev) => (page === 0 ? res.content : [...prev, ...res.content]));
      setHasMoreReplies(res.content.length > 0 && (page + 1) * 5 < res.totalElements);
      setRepliesPage(page);
    } catch (err) {
      console.error("Failed to load replies:", err);
    } finally {
      setLoadingReplies(false);
    }
  }, [comment.id]);

  const toggleReplies = () => {
    const next = !showReplies;
    setShowReplies(next);
    if (next && replies.length === 0 && local.replyCount > 0) loadReplies(0);
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    try {
      const created = await addComment(comment.postId, replyText.trim(), comment.id);
      setReplies((prev) => [created, ...prev]);
      setLocal((prev) => ({ ...prev, replyCount: prev.replyCount + 1 }));
      setReplyText("");
      setReplying(false);
      setShowReplies(true);
    } catch (err) {
      console.error("Failed to add reply:", err);
    }
  };

  const canDelete = currentUser.id === comment.authorId;

  return (
    <div className={styles.commentRow}>
      <div className={styles.avatar}>
        {comment.authorAvatarUrl ? (
          <img src={buildAvatarUrl(comment.authorAvatarUrl)} alt={comment.authorUsername} />
        ) : (
          <span>{comment.authorUsername.substring(0, 2).toUpperCase()}</span>
        )}
      </div>

      <div className={styles.commentBody}>
        <div className={styles.commentBubble}>
          <strong className={styles.commentAuthor}>@{comment.authorUsername}</strong>
          <p className={styles.commentContent}>{comment.content}</p>
        </div>

        <div className={styles.commentActions}>
          <CommentReactions
            commentId={comment.id}
            currentUserId={currentUser.id}
            reactionCounts={local.reactionCounts}
            myReaction={local.myReaction}
            availableEmojis={emojis}
            onChanged={(counts, mine) => setLocal((prev) => ({ ...prev, reactionCounts: counts, myReaction: mine }))}
          />
          <button className={styles.linkBtn} onClick={() => setReplying((v) => !v)}>Odgovori</button>
          {local.replyCount > 0 && (
            <button className={styles.linkBtn} onClick={toggleReplies}>
              {showReplies ? "Sakrij odgovore" : `Prikaži odgovore (${local.replyCount})`}
            </button>
          )}
          {canDelete && <button className={styles.linkBtnDanger} onClick={() => onDeleted(comment.id)}>Obriši</button>}
        </div>

        {replying && (
          <div className={styles.replyForm}>
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Odgovori korisniku @${comment.authorUsername}...`}
              onKeyDown={(e) => e.key === "Enter" && submitReply()}
            />
            <button onClick={submitReply}>Pošalji</button>
          </div>
        )}

        {showReplies && (
          <div className={styles.repliesList}>
            {replies.map((r) => (
              <CommentRow key={r.id} comment={r} currentUser={currentUser} emojis={emojis} onDeleted={onDeleted} />
            ))}
            {hasMoreReplies && (
              <button className={styles.loadMoreBtn} disabled={loadingReplies} onClick={() => loadReplies(repliesPage + 1)}>
                {loadingReplies ? "Učitavanje..." : "Više odgovora"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type Props = {
  postId: number;
  currentUser: UserModel;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
};

export default function PostComments({ postId, currentUser, onCommentAdded, onCommentDeleted }: Props) {
  const [comments, setComments] = useState<PostCommentDto[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [emojis, setEmojis] = useState<string[]>([]);

  useEffect(() => { getAvailableEmojis().then(setEmojis).catch(() => {}); }, []);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await getComments(postId, targetPage, 10);
      setComments((prev) => (targetPage === 0 ? res.content : [...prev, ...res.content]));
      setHasMore(res.content.length > 0 && (targetPage + 1) * 10 < res.totalElements);
      setPage(targetPage);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { load(0); }, [load]);

 const submitComment = async () => {
    if (!newComment.trim()) return;
    try {
      const created = await addComment(postId, newComment.trim());
      setComments((prev) => [created, ...prev]);
      setNewComment("");
      onCommentAdded?.();
    } catch (err) { console.error(err); }
  };

  const handleDeleted = async (id: number) => {
    if (!window.confirm("Obrisati komentar?")) return;
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      onCommentDeleted?.();
    } catch (err) { console.error(err); }
  };

  return (
    <div className={styles.commentsWrapper}>
      <div className={styles.newCommentRow}>
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Napiši komentar..."
          onKeyDown={(e) => e.key === "Enter" && submitComment()}
        />
        <button onClick={submitComment}>Objavi</button>
      </div>

      {comments.map((c) => (
        <CommentRow key={c.id} comment={c} currentUser={currentUser} emojis={emojis} onDeleted={handleDeleted} />
      ))}

      {hasMore && (
        <button className={styles.loadMoreBtn} disabled={loading} onClick={() => load(page + 1)}>
          {loading ? "Učitavanje..." : "Više komentara"}
        </button>
      )}
    </div>
  );
}