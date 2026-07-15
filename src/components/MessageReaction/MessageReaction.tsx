import { useState, useMemo } from "react";
import { Smile } from "lucide-react";
import styles from "./MessageReaction.module.css";
import type { MessageReactionDto } from "../../models/reaction";
import { addReaction, removeReaction } from "../../services/reaction.service";

type Props = {
  messageId: number;
  currentUserId: number;
  reactions: MessageReactionDto[];
  availableEmojis: string[];
};

export default function MessageReactions({ messageId, currentUserId, reactions, availableEmojis }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, MessageReactionDto[]>();
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
    <div className={styles.reactionsBar}>
      {grouped.map(([emoji, list]) => (
        <button
          key={emoji}
          className={`${styles.reactionPill} ${myReactionFor(emoji) ? styles.reactionPillActive : ""}`}
          onClick={() => toggleReaction(emoji)}
          title={list.map((r) => r.user.username).join(", ")}
        >
          <span>{emoji}</span>
          <span className={styles.reactionCount}>{list.length}</span>
        </button>
      ))}

      <div className={styles.pickerWrapper}>
        <button className={styles.addReactionBtn} onClick={() => setPickerOpen((v) => !v)} title="Add reaction">
          <Smile size={14} />
        </button>

        {pickerOpen && (
          <div className={styles.pickerPopover}>
            {availableEmojis.map((emoji) => (
              <button key={emoji} className={styles.pickerEmojiBtn} onClick={() => toggleReaction(emoji)}>
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}