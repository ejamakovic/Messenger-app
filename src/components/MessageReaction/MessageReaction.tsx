import { useState, useMemo, useEffect, useRef } from "react";
import { Smile } from "lucide-react";
import styles from "./MessageReaction.module.css";
import type { MessageReaction } from "../../models/messageReaction";
import { addReaction, removeReaction } from "../../services/reaction.service";

type Props = {
  messageId: number;
  currentUserId: number;
  reactions: MessageReaction[];
  availableEmojis: string[];
  alignRight?: boolean;
};

export default function MessageReactions({
  messageId,
  currentUserId,
  reactions,
  availableEmojis,
  alignRight = false,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }

    if (pickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pickerOpen]);

  const grouped = useMemo(() => {
    const map = new Map<string, MessageReaction[]>();
    for (const r of reactions) {
      const list = map.get(r.emoji) || [];
      list.push(r);
      map.set(r.emoji, list);
    }
    return Array.from(map.entries());
  }, [reactions]);

  const myReactionFor = (emoji: string) =>
    reactions.some((r) => r.emoji === emoji && r.user.id === currentUserId);

  const toggleReaction = async (emoji: string) => {
    setPickerOpen(false);
    try {
      if (myReactionFor(emoji)) {
        await removeReaction(messageId, emoji);
      } else {
        await addReaction(messageId, emoji);
      }
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  };

  return (
    <div className={`${styles.reactionsBar} ${alignRight ? styles.reactionsBarRight : ""}`}>
      {grouped.map(([emoji, list]) => {
        const isMyReaction = myReactionFor(emoji);

        return (
          <div key={emoji} className={styles.reactionPillWrapper}>
            <button
              className={`${styles.reactionPill} ${isMyReaction ? styles.reactionPillActive : ""}`}
              onClick={() => toggleReaction(emoji)}
            >
              <span className={styles.emojiSpan}>{emoji}</span>
              <span className={styles.reactionCount}>{list.length}</span>
            </button>

            <div className={styles.reactionTooltip}>
              {list.map((r, i) => (
                <div key={r.user?.id || i} className={styles.tooltipUser}>
                  @{r.user?.username || "Anonymous"}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className={styles.pickerWrapper} ref={pickerRef}>
        <button
          className={styles.addReactionBtn}
          onClick={() => setPickerOpen((v) => !v)}
          title="Add reaction"
        >
          <Smile size={14} />
        </button>

        {pickerOpen && (
          <div
            className={`${styles.pickerPopover} ${
              alignRight ? styles.pickerPopoverRight : styles.pickerPopoverLeft
            }`}
          >
            {availableEmojis.map((emoji) => (
              <button
                key={emoji}
                className={styles.pickerEmojiBtn}
                onClick={() => toggleReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}