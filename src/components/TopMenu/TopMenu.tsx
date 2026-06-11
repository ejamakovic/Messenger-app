import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MessageSquare, LogOut, Globe, User } from "lucide-react"; 
import { logoutUser } from "../../services/user.service";
import type { UserModel } from "../../models/user";
import styles from "./TopMenu.module.css";
import type { ConversationListDto } from "../../models/conversationListDto";
import type { NotificationDto } from "../../models/notification";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { putNotificationStatus } from "../../services/notification.service";

interface TopMenuProps {
  user: UserModel;
  conversations: ConversationListDto[];
  notifications: NotificationDto[];
  onNotificationRead: (id: number) => void;
}

export default function TopMenu({ user, conversations, notifications, onNotificationRead }: TopMenuProps) {
  const navigate = useNavigate();
  
  const [showChatsDropdown, setShowChatsDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowChatsDropdown(false);
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadNotifCount = notifications.filter(n => n.status == "DELIVERED").length;
  
  // Count conversations that have an active unread count flag attached
  const activeChatsCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const handleConversationSelect = (id: number) => {
    setShowChatsDropdown(false);
    navigate(`/chat/conversation/${id}`);
  };

  return (
    <header className={styles.topMenu} ref={menuRef}>
      <div className={styles.logoSection} onClick={() => navigate("/chat/public")}>
        <Globe className={styles.logoIcon} size={20} />
        <span className={styles.logoTitle}>ChatSphere</span>
      </div>
          
      <div className={styles.actionControls}>
        {/* PUBLIC CHAT SHORTCUT LINK */}
        <button 
          className={styles.actionIconBtn} 
          onClick={() => { navigate("/chat/public"); setShowChatsDropdown(false); setShowNotifDropdown(false); }} 
          title="Global Public Chat"
        >
          <Globe size={18} />
        </button>

        {/* ALL ACTIVE CHATS / INBOX DROPDOWN */}
        <div className={styles.dropdownWrapper}>
          <button 
            className={`${styles.actionIconBtn} ${showChatsDropdown ? styles.activeBtnState : ""}`}
            onClick={() => { setShowChatsDropdown(!showChatsDropdown); setShowNotifDropdown(false); }}
            title="All Active Chats"
          >
            <MessageSquare size={18} />
            {activeChatsCount > 0 && (
              <span className={styles.countBadge}>{activeChatsCount}</span>
            )}
          </button>
          
          {showChatsDropdown && (
            <div className={styles.menuDropdownPanel}>
              <div className={styles.dropdownHeader}>
                <h3>Active Conversations</h3>
              </div>
              <div className={styles.dropdownBodyList}>
                {conversations.length === 0 ? (
                  <p className={styles.emptyText}>No active private chats</p>
                ) : (
                  conversations.map((conv) => (
                    <div 
                      key={conv.id} 
                      className={styles.dropdownItemRow}
                      onClick={() => handleConversationSelect(conv.id)}
                    >
                      <div className={styles.rowTextData}>
                        <strong className={styles.itemTitle}>
                          @{conv.name || conv.senderUsername || `Chat #${conv.id}`}
                        </strong>
                        <p className={styles.itemPreview}>
                          {conv.lastMessage || "Click to open chat panel..."}
                        </p>
                      </div>
                      {/* Dynamic unread row dot highlight */}
                      {conv.unreadCount && conv.unreadCount > 0 ? (
                        <span className={styles.rowUnreadDotCount}>{conv.unreadCount}</span>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* SYSTEM & MESSAGE NOTIFICATIONS DROPDOWN */}
        <div className={styles.dropdownWrapper}>
          <button 
            className={`${styles.actionIconBtn} ${showNotifDropdown ? styles.activeBtnState : ""}`}
            onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowChatsDropdown(false); }}
            title="Notifications Center"
          >
            <Bell size={18} />
            {unreadNotifCount > 0 && (
              <span className={`${styles.countBadge} ${styles.alertBadgeColor}`}>{unreadNotifCount}</span>
            )}
          </button>
          
          {showNotifDropdown && (
            <div className={styles.menuDropdownPanel}>
              <div className={styles.dropdownHeader}>
                <h3>Alerts & Notifications</h3>
              </div>
              <div className={styles.dropdownBodyList}>
                {notifications.length === 0 ? (
                  <p className={styles.emptyText}>All caught up! 🎉</p>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`${styles.dropdownItemRow} ${notif.status === "DELIVERED" ? styles.unreadAlertHighlight : ""}`}
                      onClick={async () => {
                        try {              
                          await putNotificationStatus(notif.id, "OPENED");
                                  
                          onNotificationRead(notif.id);
                        } catch (err) {
                          console.error("Failed to update notification status:", err);
                      }
                    }}
                    >
                      <p className={styles.notificationContentText}>{notif.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* PROFILE BLOCK */}
        <div className={styles.userProfileSegment}>
          <div className={styles.userBadgeAvatar}>
            <User size={13} className={styles.profileUserIcon} />
            <span className={styles.profileUsername}>@{user.username}</span>
          </div>
          <button className={styles.logoutActionButton} onClick={() => logoutUser(user)} title="Log Out">
            <LogOut size={15} />
          </button>
        </div>        
      </div>      
      <div className={styles.actionControls}>
          <ThemeToggle /> {/* 👈 Right here! */}
        <div className={styles.divider} />        
      </div>
    </header>
  );
}