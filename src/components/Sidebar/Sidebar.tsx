import { useState, useRef, useEffect } from "react";
import type { UserModel } from "../../models/user";
import styles from "./Sidebar.module.css"; 
import { getOrCreatePrivateConversation } from "../../services/conversation.service";
import { sendFriendRequest } from "../../services/friendship.service"; 
import { useNavigate } from "react-router-dom";
import { RefreshCw, Radio, MessageSquare, UserPlus, MoreVertical } from "lucide-react"; 

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
  
  // State to track which user card has its options menu open
  const [activeMenuUserId, setActiveMenuUserId] = useState<number | string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 1. Filter out yourself (Backend should handle filtering out existing friends, 
  // but we keep this client-side exclusion for the current user)
  const filteredOnlineUsers = onlineUsers.filter((u) => u.username !== user.username);

  // Close menu if user clicks anywhere else on the screen
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuUserId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCardClick = (e: React.MouseEvent, targetUserId: number | string) => {
    e.stopPropagation();
    // Toggle menu open/close for this user
    setActiveMenuUserId(activeMenuUserId === targetUserId ? null : targetUserId);
  };

  const handleStartChat = async (targetUser: UserModel) => {
    setActiveMenuUserId(null); // close menu
    try {
      const conversation = await getOrCreatePrivateConversation(user.id, targetUser.id);
      navigate(`/chat/conversation/${conversation.id}`);
    } catch (err) {
      console.error("FAILED TO INITIATE PRIVATE SESSION:", err);
    }
  };

  const handleAddFriend = async (targetUser: UserModel) => {
    setActiveMenuUserId(null); // close menu
    try {
      await sendFriendRequest(user.id, targetUser.id);
      alert(`Zahtjev za prijateljstvo poslan korisniku @${targetUser.username}!`);
      // Optional: Trigger onRefresh() here to update list if backend filters them out instantly
    } catch (err) {
      console.error("FAILED TO SEND FRIEND REQUEST:", err);
      alert("Greška prilikom slanja zahtjeva.");
    }
  };

  return (
    <div className={`${styles.sidebarWrapper} ${className || ""}`}>
      <div className={styles.sidebarSectionHeader}> 
        <div className={styles.headerInfoBlock}>
          <Radio size={16} className={styles.liveBroadcastIcon} />
          <span className={styles.headerTitle}>Korisnici online</span>
          <span className={styles.onlineBadgeCount}>{filteredOnlineUsers.length}</span>
        </div>
        <button onClick={onRefresh} className={styles.sidebarRefreshBtn} title="Osvježi">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className={styles.onlineUserScrollContainer}>
        {filteredOnlineUsers.length === 0 ? (
          <div className={styles.emptyStatusPlaceholder}>
            <p>Nema drugih korisnika na mreži</p>
          </div>
        ) : (
          filteredOnlineUsers.map((u) => {
            const isMenuOpen = activeMenuUserId === u.id;
            return (
              <div
                key={u.id || u.username}
                className={styles.interactiveUserCard}
                onClick={(e) => handleCardClick(e, u.id)}
              >
                <div className={styles.avatarMockBlock}>
                  {u.username.substring(0, 2).toUpperCase()}
                  <div className={styles.statusIndicatorPulse} />
                </div>
                <span className={styles.targetCardUsername}>@{u.username}</span>
                
                <div className={styles.menuTriggerBtn}>
                  <MoreVertical size={16} />
                </div>

                {/* Conditional Options Menu Popover */}
                {isMenuOpen && (
                  <div className={styles.optionsMenuPopover} ref={menuRef}>
                    <button 
                      className={styles.menuOptionItem} 
                      onClick={(e) => { e.stopPropagation(); handleStartChat(u); }}
                    >
                      <MessageSquare size={14} />
                      <span>Započni chat</span>
                    </button>
                    <button 
                      className={styles.menuOptionItem} 
                      onClick={(e) => { e.stopPropagation(); handleAddFriend(u); }}
                    >
                      <UserPlus size={14} />
                      <span>Dodaj prijatelja</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}