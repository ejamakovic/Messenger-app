import { useState, useMemo, useEffect, useRef } from "react";
import { Smile } from "lucide-react";
import styles from "../PostReactions/PostReactions.module.css";
import { setCommentReaction } from "../../services/commentReaction.service";

type Props = {
  commentId: number;
  currentUserId: number;
  reactionCounts: Record<string, number>;
  myReaction?: string | null;
  availableEmojis: string[];
  onChanged?: (counts: Record<string, number>, myReaction: string | null) => void;
};

export default function CommentReactions({ commentId, reactionCounts, myReaction, availableEmojis, onChanged }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setPickerOpen(false);
    }
    if (pickerOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

  const entries = useMemo(() => Object.entries(reactionCounts || {}), [reactionCounts]);

  const toggle = async (emoji: string) => {
    setPickerOpen(false);
    const next = { ...reactionCounts };
    if (myReaction) {
      next[myReaction] = Math.max((next[myReaction] || 1) - 1, 0);
      if (next[myReaction] === 0) delete next[myReaction];
    }
    let nextMine: string | null = emoji;
    if (myReaction === emoji) nextMine = null;
    else next[emoji] = (next[emoji] || 0) + 1;
    onChanged?.(next, nextMine);

    try {
      await setCommentReaction(commentId, emoji);
    } catch (err) {
      console.error("Failed to set comment reaction:", err);
    }
  };

  return (
    <div className={styles.reactionsBar}>
      {entries.map(([emoji, count]) => (
        <button
          key={emoji}
          className={`${styles.reactionPill} ${myReaction === emoji ? styles.reactionPillActive : ""}`}
          onClick={() => toggle(emoji)}
        >
          <span className={styles.emojiSpan}>{emoji}</span>
          <span className={styles.reactionCount}>{count}</span>
        </button>
      ))}
      <div className={styles.pickerWrapper} ref={pickerRef}>
        <button className={styles.addReactionBtn} onClick={() => setPickerOpen((v) => !v)}>
          <Smile size={12} />
        </button>
        {pickerOpen && (
          <div className={styles.pickerPopover}>
            {availableEmojis.map((emoji) => (
              <button key={emoji} className={styles.pickerEmojiBtn} onClick={() => toggle(emoji)}>{emoji}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}