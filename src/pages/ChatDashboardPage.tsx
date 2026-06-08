import styles from "./ChatDashboardPage.module.css";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom"; 
import MessageInput from "../components/MessageInput/MessageInput";
import Chat from "../components/Chat/Chat"; 
import Sidebar from "../components/Sidebar/Sidebar";
import TopMenu from "../components/TopMenu/TopMenu";

import { subscribe, unsubscribe } from "../services/socket.service";
import { getOnlineUsers, logoutUser } from "../services/user.service";
import { getConversationMessages, sendMessage } from "../services/message.service"; 
import { getUserConversations, getConversation, getPublicConversation } from "../services/conversation.service";

import type { UserModel } from "../models/user";
import type { Message } from "../models/message";
import type { Conversation } from "../models/conversation";
import type { ConversationListDto } from "../models/conversationListDto";
import type { NotificationDto } from "../models/notification";

import { useChatScroll } from "../hook/useChatScroll";
import { useAuth } from "../context/AuthContext";

export default function ChatDashboardPage() {
  const { user, loading } = useAuth();
  const { conversationId } = useParams<{ conversationId?: string }>();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserModel[]>([]);
  const [conversations, setConversations] = useState<ConversationListDto[]>([]);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  
  const [chat, setChat] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [page, setPage] = useState(0);

  // DASHBOARD WORKSPACE LOADING STATES
  const [pageLoading, setPageLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const canSend = text.trim().length > 0 || selectedFiles.length > 0;

  /**
   * Fetches context updates, inbox conversations index summary, and online active directory status sets
   **/
  const fetchChatData = useCallback(async () => {
    if (!user) return;
    setPageLoading(true);

    try {    
      let currentConv: Conversation | null = null;

      if (conversationId) {
        currentConv = await getConversation(Number(conversationId));
      } else {
        currentConv = await getPublicConversation();
      }

      if (!currentConv?.id) {
        throw new Error("Target conversation context could not be resolved.");
      }
        
      setConversation(currentConv);
      
      const [users, messagesPage, privateChats] = await Promise.all([
        getOnlineUsers(),
        getConversationMessages(currentConv.id, 0),
        getUserConversations(user.id),
        // If you have a real REST notifications fetch endpoint, add it here:
        // getMyNotifications()
      ]);

      setOnlineUsers(users);
      setConversations(privateChats.content || []);
      setChat(messagesPage.content.reverse());

      setHasMore(messagesPage.content.length >= 30);
      setPage(1);
    } catch (err) {
      console.error("CHAT STORAGE INITIALIZATION ERROR:", err);
    } finally {
      setPageLoading(false);
    }
  }, [user, conversationId]);

  useEffect(() => {
    if (user) {
      fetchChatData();
    }
  }, [user, conversationId, fetchChatData]);

  // PAGINATION ENGINE FOR CHAT HISTORY WINDOW PANEL
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

  // REALTIME WEB-SOCKET LAYER INTERACTION LIFECYCLES
  useEffect(() => {
    if (!user || !conversation) return;

    const handleMessage = (msg: Message) => {
      if (msg.conversationId === conversation.id) {
        // 1. Direct message capture to screen frame viewport stream
        setChat((prev) => [...prev, msg]);
      } else {
        // 2. Increment active dropdown badge item unread targets dynamically if received elsewhere
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === msg.conversationId);
          if (exists) {
            return prev.map((c) =>
              c.id === msg.conversationId
                ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: msg.content }
                : c
            );
          }
          // Fallback context fallback insert structure if new dynamic message creates a room
          return [
            {
              id: msg.conversationId,
              name: msg.sender.username || `User #${msg.sender.id}`,
              lastMessage: msg.content,
              unreadCount: 1,
            } as ConversationListDto,
            ...prev,
          ];
        });
      }
    };

    const handleUserJoin = (data: any) => {
      const newUser = data.user;
      if (!newUser) return;
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.username === newUser.username)) return prev;
        return [...prev, newUser];
      });
    };

    const handleUserLeave = (data: any) => {
      const leftUser = data.user;
      if (!leftUser) return;
      setOnlineUsers((prev) => prev.filter((u) => u.username !== leftUser.username));
    };

    const handleNotification = (notif: NotificationDto) => {
      setNotifications((prev) => [notif, ...prev]);
    };

    subscribe("message", handleMessage);
    subscribe("user_join", handleUserJoin);
    subscribe("user_leave", handleUserLeave);
    subscribe("notification", handleNotification);

    return () => {
      unsubscribe("message", handleMessage);
      unsubscribe("user_join", handleUserJoin);
      unsubscribe("user_leave", handleUserLeave);
      unsubscribe("notification", handleNotification);
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

  // Auth Guard Component Frame Layout Breakout
  if (loading || !user) {
    return <div className={styles.appSpinnerView}>Synchronizing authorization session tokens...</div>;
  }

  // Dashboard Workspace Component Loading Breakout Guard
  if (pageLoading) {
    return <div className={styles.appSpinnerView}>Loading chat resources and historical frames...</div>;
  }

  return (
    <div className={styles.masterWrapper}>
      {/* 1. FIXED TOP NAV CONTROLS FOR CHATS & NOTIFICATION ACTIONS */}
      <TopMenu 
        user={user} 
        conversations={conversations} 
        notifications={notifications} 
      />

      <div className={styles.container}>
        {/* 2. RECONSTRUCTED CLEAN ONLINE-ONLY DIRECTORY SIDEBAR */}
        <Sidebar 
          user={user}        
          onlineUsers={onlineUsers}
          onRefresh={fetchChatData}
          className={styles.sidebar}        
        />
        
        {/* 3. CORE ACTIVE DISPLAY PANEL STREAM */}
        <div className={styles.chatSection}>
          <div className={styles.activeChannelBanner}>
            {conversationId ? (
              <span>🔒 Private Chat with <strong>@{conversation?.name || "Loading Context..."}</strong></span>
            ) : (
              <span>🌐 Public Global Chatroom Arena</span>
            )}
          </div>

          {loadingMore && <div className={styles.loadingMoreIndicator}>Fetching previous history layers...</div>}
          
          <div className={styles.chatMessages}>
            <Chat
              currentUser={user}
              messages={chat}
              containerRef={containerRef}
              onScroll={onScroll}
            />
          </div>

          <div className={styles.chatInput}>
            <MessageInput
              text={text}
              files={selectedFiles} 
              canSend={canSend}
              onTextChange={setText}
              onFileSelect={setSelectedFiles}
              onSend={handleSend}
            />
          </div>               
        </div>
      </div>
    </div>
  );
}