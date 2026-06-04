import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../../models/user";
import styles from "./Sidebar.module.css"; 
import { getOrCreatePrivateConversation } from "../../services/conversation.service";

export interface ConversationListDto {
  id: number;
  content: string; 
  senderId: number;
  senderUsername: string;
  timestamp: string; 
}

interface SidebarProps {
  user: User;
  conversations: ConversationListDto[];
  onlineUsers: User[];
  onRefresh: () => Promise<void>;
  className?: string;       
  headerClassName?: string; 
}

export default function Sidebar({ 
  user, 
  conversations, 
  onlineUsers, 
  onRefresh, 
  className, 
  headerClassName 
}: SidebarProps) {
  const navigate = useNavigate();
  const [sidebarTab, setSidebarTab] = useState<"chats" | "online">("chats");    
  const filteredOnlineUsers = onlineUsers.filter((u) => u.username !== user.username);

  return (
    <div className={className}> {/* Layout styling from page CSS */}
      
      {/* Header Layout from page CSS */}
      <div className={headerClassName}> 
        <span>👤 {user.username}</span>          
        <button onClick={onRefresh} className={styles.refreshBtn} title="Refresh Channels">
          🔄
        </button>
      </div>

      {/* Internal Tabs styling from component CSS */}
      <div className={styles.tabContainer}>
        <button 
          onClick={() => setSidebarTab("chats")}
          className={`${styles.tabButton} ${sidebarTab === "chats" ? styles.tabButtonActive : ""}`}
        >
          💬 Chats
        </button>
        <button 
          onClick={() => setSidebarTab("online")}
          className={`${styles.tabButton} ${sidebarTab === "online" ? styles.tabButtonActive : ""}`}
        >
          🟢 Online ({filteredOnlineUsers.length})
        </button>
      </div>

      {/* Internal Content List view switching */}
      <div className={styles.sidebarContent}>
        {sidebarTab === "chats" ? (
          <div className={styles.conversationsList}>
            <div className={styles.publicRoomItem} onClick={() => navigate("/chat/public")}>
              🌐 Public General Room
            </div>

            {conversations.map((c) => (
              <div key={c.id} className={styles.conversationItem} onClick={() => navigate(`/chat/conversation/${c.id}`)}>
                <span className={styles.conversationName}>💬 {c.senderUsername}</span>
                <span className={styles.conversationPreview}>
                  {c.content || "No messages yet"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.onlineContainer}>
            <div className={styles.onlineTitle}>Online Users</div>
            {filteredOnlineUsers.map((u) => (
              <div
                key={u.username}
                className={styles.userItem}
                onClick={async () => {
                  const conversation =
                    await getOrCreatePrivateConversation(user.id, u.id);

                  navigate(`/chat/conversation/${conversation.id}`);
                }
              }
              >
                {u.username}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}