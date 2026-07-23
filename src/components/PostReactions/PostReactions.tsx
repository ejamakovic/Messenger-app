import { useState, useMemo, useEffect, useRef } from "react";
import styles from "./PostReactions.module.css";
import { getPostReactions, setPostReaction } from "../../services/postReaction.service";
import type { PostReactionDto } from "../../models/postReaction";

type Props = {
  postId: number;
  currentUserId: number;
  availableEmojis: string[];
};

export default function PostReactions({ postId, currentUserId, availableEmojis }: Props) {
  const [reactions, setReactions] = useState<PostReactionDto[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { getPostReactions(postId).then(setReactions).catch(console.error); }, [postId]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    if (pickerOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [pickerOpen]);

  const grouped = useMemo(() => {
    const map = new Map<string, PostReactionDto[]>();
    for (const r of reactions) map.set(r.emoji, [...(map.get(r.emoji) || []), r]);
    return Array.from(map.entries());
  }, [reactions]);

  const toggle = async (emoji: string) => {
    setPickerOpen(false);
    try {
      const result = await setPostReaction(postId, emoji);
      const fresh = await getPostReactions(postId); // simplest correct source of truth
      setReactions(fresh);
    } catch (err) { console.error(err); }
  };

  return (
    <div className={styles.reactionsBar}>
      {grouped.map(([emoji, list]) => {
        const mine = list.some((r) => r.user.id === currentUserId);
        return (
          <div key={emoji} className={styles.reactionPillWrapper}>
            <button className={`${styles.reactionPill} ${mine ? styles.reactionPillActive : ""}`} onClick={() => toggle(emoji)}>
              <span className={styles.emojiSpan}>{emoji}</span>
              <span className={styles.reactionCount}>{list.length}</span>
            </button>
            <div className={styles.reactionTooltip}>
              {list.map((r) => <div key={r.user.id} className={styles.tooltipUser}>@{r.user.username}</div>)}
            </div>
          </div>
        );
      })}
      <div className={styles.pickerWrapper} ref={pickerRef}>
        <button className={styles.addReactionBtn} onClick={() => setPickerOpen((v) => !v)}>😊</button>
        {pickerOpen && (
          <div className={styles.pickerPopover}>
            {availableEmojis.map((e) => <button key={e} className={styles.pickerEmojiBtn} onClick={() => toggle(e)}>{e}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}