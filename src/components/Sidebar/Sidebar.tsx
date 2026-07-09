import { useState, useRef, useEffect } from "react";
import type { UserModel } from "../../models/user";
import styles from "./Sidebar.module.css";
import { getOrCreatePrivateConversation } from "../../services/conversation.service";
import { sendFriendRequest } from "../../services/friendship.service";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Radio, MessageSquare, UserPlus, MoreVertical, User, Users } from "lucide-react";
import GroupChatModal from "../GroupChatModal/GroupChatModal";

interface SidebarProps {
  user: UserModel;
  onlineUsers: UserModel[];
  onRefresh: () => Promise<void>;
  className?: string;
}

export default function Sidebar({ user, onlineUsers, onRefresh, className }: SidebarProps) {
  const navigate = useNavigate();
  const [activeMenuUserId, setActiveMenuUserId] = useState<number | string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const filteredOnlineUsers = onlineUsers.filter((u) => u.username !== user.username);

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
    setActiveMenuUserId(activeMenuUserId === targetUserId ? null : targetUserId);
  };

  const handleViewProfile = (targetUser: UserModel) => {
    setActiveMenuUserId(null);
    navigate(`/profile/${targetUser.id}`);
  };

  const handleStartChat = async (targetUser: UserModel) => {
    setActiveMenuUserId(null);
    try {
      const conversation = await getOrCreatePrivateConversation(user.id, targetUser.id);
      navigate(`/chat/conversation/${conversation.id}`);
    } catch (err) {
      console.error("FAILED TO INITIATE PRIVATE SESSION:", err);
    }
  };

  const handleAddFriend = async (targetUser: UserModel) => {
    setActiveMenuUserId(null);
    try {
      await sendFriendRequest(user.id, targetUser.id);
      alert(`Zahtjev za prijateljstvo poslan korisniku @${targetUser.username}!`);
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
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={() => setShowGroupModal(true)}
            className={styles.sidebarRefreshBtn}
            title="Novi grupni chat"
          >
            <Users size={14} />
          </button>
          <button onClick={onRefresh} className={styles.sidebarRefreshBtn} title="Osvježi">
            <RefreshCw size={14} />
          </button>
        </div>
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
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.username} style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: "cover" }} />
                  ) : (
                    u.username.substring(0, 2).toUpperCase()
                  )}
                  <div className={styles.statusIndicatorPulse} />
                </div>
                <span className={styles.targetCardUsername}>@{u.username}</span>

                <div className={styles.menuTriggerBtn}>
                  <MoreVertical size={16} />
                </div>

                {isMenuOpen && (
                  <div className={styles.optionsMenuPopover} ref={menuRef}>
                    <button
                      className={styles.menuOptionItem}
                      onClick={(e) => { e.stopPropagation(); handleViewProfile(u); }}
                    >
                      <User size={14} />
                      <span>Pogledaj profil</span>
                    </button>
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

      {showGroupModal && (
        <GroupChatModal
          currentUserId={user.id}
          onClose={() => setShowGroupModal(false)}
          onCreated={(conversationId) => {
            setShowGroupModal(false);
            navigate(`/chat/conversation/${conversationId}`);
          }}
        />
      )}
    </div>
  );
}