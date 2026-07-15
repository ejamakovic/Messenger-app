import { useState, useMemo } from "react";
import { Smile } from "lucide-react";
import styles from "./MessageReaction.module.css";
import type { MessageReaction } from "../../models/messageReaction";
import { addReaction, removeReaction } from "../../services/reaction.service";

type Props = {
  messageId: number;
  currentUserId: number;
  reactions: MessageReaction[];
  availableEmojis: string[];
  alignRight?: boolean; // New prop to align picker left/right dynamically
};

export default function MessageReactions({ messageId, currentUserId, reactions, availableEmojis, alignRight = false }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // Group reactions by emoji cleanly
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
            
            {/* Custom Tooltip listing usernames on hover */}
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

      <div className={styles.pickerWrapper}>
        <button 
          className={styles.addReactionBtn} 
          onClick={() => setPickerOpen((v) => !v)} 
          title="Add reaction"
        >
          <Smile size={14} />
        </button>

        {pickerOpen && (
          <>
            {/* Click-away backdrop overlay */}
            <div className={styles.pickerOverlay} onClick={() => setPickerOpen(false)} />
            
            {/* Dynamically align picker popover container */}
            <div className={`${styles.pickerPopover} ${alignRight ? styles.pickerPopoverRight : styles.pickerPopoverLeft}`}>
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
          </>
        )}
      </div>
    </div>
  );
}