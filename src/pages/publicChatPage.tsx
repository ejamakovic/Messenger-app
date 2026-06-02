import styles from "../styles/PublicChatPage.module.css";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Added for navigation between chats
import OnlineUsers from "../components/OnlineUsers";
import MessageInput from "../components/MessageInput/MessageInput";
import PublicChat from "../components/Chat/PublicChat";
import TopMenu from "../components/TopMenu"; // Imported TopMenu component

import { subscribe, unsubscribe } from "../services/socket.service";
import { getOnlineUsers, logoutUser } from "../services/user.service";
import { getConversationMessages, sendMessage } from "../services/message.service"; // Imported getAllPrivateChats
import { getPublicConversation, getUserConversations } from "../services/conversation.service";

import type { User } from "../models/user";
import type { Message } from "../models/message";
import type { Conversation } from "../models/conversation";

import { useChatScroll } from "../hook/useChatScroll";
import { useAuth } from "../context/AuthContext";

export default function PublicChatPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Navigation & UI Lists
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Sidebar Tab Toggle state ("chats" display or "online" display)
  const [sidebarTab, setSidebarTab] = useState<"chats" | "online">("chats");

  // Chat History & Input Processing
  const [chat, setChat] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const canSend = text.trim().length > 0 || selectedFiles.length > 0;

  /**
   * Fetches initial room setups, online user arrays, and existing user DM records
   * */
  const fetchInitialData = useCallback(async () => {
    if (!user?.username) return;
    
    try {
      const publicConversation = await getPublicConversation();

      if (!publicConversation?.id) {
        throw new Error("Public conversation not found");
      }

      setConversation(publicConversation);

      // Fetch Online Users, Public Messages, and Active Private DM Conversations concurrently
      const [users, messagesPage, privateChats] = await Promise.all([
        getOnlineUsers(),
        getConversationMessages(publicConversation.id, 0),
        getUserConversations(user.id)
      ]);

      setOnlineUsers(users);
      setConversations(privateChats.content || []);
      setChat(messagesPage.content.reverse());

      setHasMore(messagesPage.content.length >= 30);
      setPage(1); 
      
    } catch (err) {
      console.error("INITIALIZATION ERROR:", err);
    }
  }, [user?.username]);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user, fetchInitialData]);

  // PAGINATION
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !conversation) return;

    setLoadingMore(true);
    try {
      const nextPage = await getConversationMessages(conversation.id, page);

      if (nextPage.content.length === 0) {
        setHasMore(false);
        return;
      }

      setChat((prev) => [...nextPage.content.reverse(), ...prev]);
      setPage((prev) => prev + 1);
    } catch (err) {
      console.error("LOAD MORE ERROR:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, conversation]);

  const { containerRef, onScroll } = useChatScroll(chat, loadMore);

  // SOCKET MANAGEMENT
  useEffect(() => {
    if (!user || !conversation) return;

    const handleMessage = (msg: Message) => {
      if (msg.conversationId === conversation.id) {
        setChat((prev) => [...prev, msg]);
      }
    };

    const handleUserJoin = (data: any) => {
      const newUser = data.user;
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.username === newUser.username)) return prev;
        return [...prev, newUser];
      });
    };

    const handleUserLeave = (data: any) => {
      const leftUser = data.user;
      setOnlineUsers((prev) => prev.filter((u) => u.username !== leftUser.username));
    };

    subscribe("message", handleMessage);
    subscribe("user_join", handleUserJoin);
    subscribe("user_leave", handleUserLeave);

    return () => {
      unsubscribe("message", handleMessage);
      unsubscribe("user_join", handleUserJoin);
      unsubscribe("user_leave", handleUserLeave);
    };
  }, [user, conversation]);
  
  useEffect(() => {
    const handleClose = () => {
      if (user) logoutUser(user);
    };
    window.addEventListener("beforeunload", handleClose);
    return () => window.removeEventListener("beforeunload", handleClose);
  }, [user]);

  const handleSend = async () => {
    if (!canSend || !conversation || !user) return;
    try {
      await sendMessage(user.id, conversation.id, text, selectedFiles);
      setText("");
      setSelectedFiles([]);
    } catch (err) {
      console.error("SEND MESSAGE ERROR:", err);
    }
  };

  if (loading || !user) {
    return <div className={styles.loadingContainer}>Loading App...</div>;
  }

  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span>👤 {user.username}</span>          
          <button onClick={fetchInitialData} className={styles.refreshBtn} title="Refresh Channels">
            🔄
          </button>
        </div>

        {/* Dynamic Navigation Tabs inside the Sidebar */}
        <div className={styles.tabContainer} style={{ display: "flex", borderBottom: "1px solid #eee" }}>
          <button 
            onClick={() => setSidebarTab("chats")}
            style={{ flex: 1, padding: "10px", background: sidebarTab === "chats" ? "#f5f5f5" : "none", border: "none", fontWeight: sidebarTab === "chats" ? "bold" : "normal", cursor: "pointer" }}
          >
            💬 Chats
          </button>
          <button 
            onClick={() => setSidebarTab("online")}
            style={{ flex: 1, padding: "10px", background: sidebarTab === "online" ? "#f5f5f5" : "none", border: "none", fontWeight: sidebarTab === "online" ? "bold" : "normal", cursor: "pointer" }}
          >
            🟢 Online ({onlineUsers.length})
          </button>
        </div>

        {/* Conditional Tab Rendering */}
        <div className={styles.sidebarContent} style={{ padding: "10px", overflowY: "auto", flex: 1 }}>
          {sidebarTab === "chats" ? (
            <div className={styles.conversationsList} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Permanent Row for Global General Chat room */}
              <div 
                className={styles.conversationItemActive} 
                style={{ padding: "10px", background: "#e6f7ff", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
              >
                🌐 Public General Room
              </div>

              {/* Private DM Target Mapping Rows */}
              {conversations.map((c: Conversation) => {
                // Find out the username of the other person in the private chat
                //const participant = c.participant?.username || "Direct Message";
                return (
                  <div 
                    key={c.id || c.id} 
                    onClick={() => navigate(`/chat/${c.id}`)}
                    style={{ padding: "10px", background: "#fff", borderRadius: "8px", cursor: "pointer", border: "1px solid #eee" }}
                  >
                    💬 User
                  <span>Last message</span>
                  </div>
                  
                );
              })}
            </div>
          ) : (
            <OnlineUsers users={onlineUsers} currentUser={user} />
          )}
        </div>
      </div>

      {/* MAIN VIEWPORT SECTION */}
      <div className={styles.chatSection}>

        {loadingMore && <div className={styles.loadingMoreIndicator}>Fetching history...</div>}
        
        <div className={styles.chatMessages}>
          <PublicChat
            currentUser={user}
            messages={chat}
            containerRef={containerRef}
            onScroll={onScroll}
          />
        </div>
        
        <div className={styles.chatInput}>
          <MessageInput
            text={text}
            file={selectedFiles}
            canSend={canSend}
            onTextChange={setText}
            onFileSelect={setSelectedFiles}
            onSend={handleSend}
          />
        </div>
      </div>
    </div>
  );
}