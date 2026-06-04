import styles from "../styles/PublicChatPage.module.css";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom"; 
import MessageInput from "../components/MessageInput/MessageInput";
import PublicChat from "../components/Chat/PublicChat"; 
import Sidebar, { type ConversationListDto } from "../components/Sidebar/Sidebar";

import { subscribe, unsubscribe } from "../services/socket.service";
import { getOnlineUsers, logoutUser } from "../services/user.service";
import { getConversationMessages, sendMessage } from "../services/message.service"; 
import { getUserConversations, getConversation } from "../services/conversation.service";

import type { User } from "../models/user";
import type { Message } from "../models/message";
import type { Conversation } from "../models/conversation";

import { useChatScroll } from "../hook/useChatScroll";
import { useAuth } from "../context/AuthContext";

export default function PrivateChatPage() {
  const { user, loading } = useAuth();
  
  // Notice we use "conversationId" to match your App.tsx routes setup exactly
  const { conversationId } = useParams<{ conversationId?: string }>();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<ConversationListDto[]>([]);
  
  const [chat, setChat] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const canSend = text.trim().length > 0 || selectedFiles.length > 0;

  const fetchPrivateData = useCallback(async () => {
    if (!user || !conversationId) return;

    try {
      // 1. Await the database object directly into a local variable first!
      const fetchedConv = await getConversation(Number(conversationId));
      if (!fetchedConv) return;
      
      // Save it safely to state for layout rendering later
      setConversation(fetchedConv);

      // 2. Use the local variable (fetchedConv.id) for your concurrent API tasks
      const [users, messagesPage, privateChats] = await Promise.all([
        getOnlineUsers(),
        getConversationMessages(fetchedConv.id, 0), // Clean & safe parameter read!
        getUserConversations(user.id),
      ]);

      setOnlineUsers(users);
      setConversations(privateChats.content || []);
      setChat(messagesPage.content.reverse());

      setHasMore(messagesPage.content.length >= 30);
      setPage(1);
    } catch (err) {
      console.error("PRIVATE INITIALIZATION ERROR:", err);
    }
  }, [user, conversationId]); // Removed 'conversation' from dependencies to kill infinite loops

  useEffect(() => {
    if (user && conversationId) {
      fetchPrivateData();
    }
  }, [user, conversationId, fetchPrivateData]);

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

    subscribe("message", handleMessage);
    return () => unsubscribe("message", handleMessage);
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
    return <div className={styles.loadingContainer}>Loading Chat...</div>;
  }

  return (
    <div className={styles.container}>
      <Sidebar 
        user={user}
        conversations={conversations}
        onlineUsers={onlineUsers}
        onRefresh={fetchPrivateData}
        className={styles.sidebar}
        headerClassName={styles.sidebarHeader}
      />

      <div className={styles.chatSection}>
        <div style={{ padding: "10px 20px", background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)", fontWeight: "bold" }}>
          🔒 Private Chat with @{conversation?.name || "Loading..."}
        </div>

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