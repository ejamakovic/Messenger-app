import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./UserConversations.module.css";
import { API_URL } from "../../services/api";
import { getUserConversations } from "../../services/conversation.service";
import type { Conversation } from "../../models/conversation";
import type { User } from "../../models/user";

type Props = {
  currentUser: User;
  activeConversationId?: string;
};

export default function UserConversations({ currentUser, activeConversationId }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getUserConversations();
        setConversations(data);
      } catch (err) {
        console.error("Failed to load conversations", err);
      }
    };
    fetchConversations();
  }, []);

  const getDisplayData = (conv: Conversation) => {
    // Logic for Private Chats: Show the other person's info
    if (conv.type === "PRIVATE") {
      const otherUser = conv.participants?.find(p => p.username !== currentUser.username);
      return {
        name: otherUser?.username || "Private Chat",
        image: otherUser?.avatarUrl ? `${API_URL}${otherUser.avatarUrl}` : "/default-avatar.png",
      };
    }
    // Logic for Group/Public Chats
    return {
      name: conv.name || "Public Chat",
      image: conv.imageUrl ? `${API_URL}${conv.imageUrl}` : "/default-group.png",
    };
  };

  const truncate = (text?: string) => {
    if (!text) return "No messages yet";
    return text.length > 25 ? text.substring(0, 25) + "..." : text;
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Messages</h3>
      <div className={styles.list}>
        {conversations.map((conv) => {
          const { name, image } = getDisplayData(conv);
          const isActive = activeConversationId === conv.id;

          return (
            <div 
              key={conv.id} 
              className={`${styles.item} ${isActive ? styles.active : ""}`}
              onClick={() => navigate(`/chat/${conv.id}`)}
            >
              <div className={styles.avatarWrapper}>
                <img src={image} alt={name} className={styles.avatar} />
                {/* Optional: Add green dot if it's a private chat and user is online */}
              </div>
              
              <div className={styles.info}>
                <div className={styles.header}>
                  <span className={styles.name}>{name}</span>
                  {conv.lastMessage?.createdAt && (
                    <span className={styles.time}>
                      {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className={styles.lastMessage}>
                  {truncate(conv.lastMessage?.content)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}