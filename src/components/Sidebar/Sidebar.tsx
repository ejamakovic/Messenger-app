import type { UserModel } from "../../models/user";
import styles from "./Sidebar.module.css"; 
import { getOrCreatePrivateConversation } from "../../services/conversation.service";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Radio } from "lucide-react"; // Using Lucide icons for crisp look

interface SidebarProps {
  user: UserModel;
  onlineUsers: UserModel[];
  onRefresh: () => Promise<void>;
  className?: string;       
}

export default function Sidebar({ 
  user, 
  onlineUsers, 
  onRefresh, 
  className 
}: SidebarProps) {
  const navigate = useNavigate();
  
  const filteredOnlineUsers = onlineUsers.filter((u) => u.username !== user.username);

  const handleUserClick = async (targetUser: UserModel) => {
    try {
      const conversation = await getOrCreatePrivateConversation(user.id, targetUser.id);
      navigate(`/chat/conversation/${conversation.id}`);
    } catch (err) {
      console.error("FAILED TO INITIATE PRIVATE SESSION:", err);
    }
  };

  return (
    <div className={`${styles.sidebarWrapper} ${className || ""}`}>
      <div className={styles.sidebarSectionHeader}> 
        <div className={styles.headerInfoBlock}>
          <Radio size={16} className={styles.liveBroadcastIcon} />
          <span className={styles.headerTitle}>Online Directory</span>
          <span className={styles.onlineBadgeCount}>{filteredOnlineUsers.length}</span>
        </div>
        <button onClick={onRefresh} className={styles.sidebarRefreshBtn} title="Refresh Directory">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className={styles.onlineUserScrollContainer}>
        {filteredOnlineUsers.length === 0 ? (
          <div className={styles.emptyStatusPlaceholder}>
            <p>No other peers online</p>
            <span>Invite users to start messaging!</span>
          </div>
        ) : (
          filteredOnlineUsers.map((u) => (
            <div
              key={u.id || u.username}
              className={styles.interactiveUserCard}
              onClick={() => handleUserClick(u)}
            >
              <div className={styles.avatarMockBlock}>
                {u.username.substring(0, 2).toUpperCase()}
                <div className={styles.statusIndicatorPulse} />
              </div>
              <span className={styles.targetCardUsername}>@{u.username}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}