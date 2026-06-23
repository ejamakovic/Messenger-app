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
import { getUserConversations, getConversation, getPublicConversation, patchConversationLastSeen } from "../services/conversation.service";

import type { UserModel } from "../models/user";
import type { Message } from "../models/message";
import type { Conversation } from "../models/conversation";
import type { ConversationListDto } from "../models/conversationListDto";
import type { NotificationDto } from "../models/notification";

import { useChatScroll } from "../hook/useChatScroll";
import { useAuth } from "../context/AuthContext";
import { getNotifications } from "../services/notification.service";

// ─── Dev logger ────────────────────────────────────────────────────────────────
// All console output is gated behind this flag.
// In production (NODE_ENV=production) nothing is logged.
const IS_DEV = import.meta.env.DEV;

const log = {
  info:  (tag: string, msg: string, data?: unknown) => IS_DEV && console.log(`[${tag}] ${msg}`, data ?? ""),
  warn:  (tag: string, msg: string, data?: unknown) => IS_DEV && console.warn(`[${tag}] ⚠️ ${msg}`, data ?? ""),
  error: (tag: string, msg: string, data?: unknown) => console.error(`[${tag}] ❌ ${msg}`, data ?? ""),
  //            ↑ errors always log — you want these in production monitoring
};
// ───────────────────────────────────────────────────────────────────────────────

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
  const canSend = text.trim().length > 0 || selectedFiles.length > 0;

  const [pageLoading, setPageLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  
  // ---------------------------------------------------
  // ------------ LAST SEEN TRACKING -------------------
  // ---------------------------------------------------
  const markConversationAsRead = useCallback(async (currentChatList = chat) => {
    if (!conversation?.id || !user) {
      log.warn("LAST_SEEN", "Cannot mark as read — missing conversation or user.", {
        conversationId: conversation?.id,
        userId: user?.id,
      });
      return;
    }

    if (currentChatList.length === 0) {
      log.info("LAST_SEEN", "Chat is empty, nothing to mark as read.");
      return;
    }

    const lastMsg = currentChatList[currentChatList.length - 1];
    log.info("LAST_SEEN", `Updating last seen.`, {
      conversationId: conversation.id,
      userId: user.id,
      lastMessageId: lastMsg.id,
    });

    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c))
    );

    try {
      await patchConversationLastSeen(conversation.id, user.id, lastMsg.id);
      log.info("LAST_SEEN", "Last seen updated successfully.");
    
    } catch (err) {
      log.error("LAST_SEEN", "Failed to update last seen.", err);
    }
  }, [conversation?.id, user, chat]);

  // ---------------------------------------------------
  // ----------------- INIT ----------------------------
  // ---------------------------------------------------
  const fetchChatData = useCallback(async () => {
    if (!user) {
      log.warn("INIT", "fetchChatData called without an authenticated user — skipping.");
      return;
    }

    log.info("INIT", `Fetching chat data. conversationId param: ${conversationId ?? "none (public)"}`);
    setPageLoading(true);

    try {
      let currentConv: Conversation | null = null;

      if (conversationId) {
        log.info("INIT", `Resolving private conversation #${conversationId}`);
        currentConv = await getConversation(Number(conversationId));
      } else {
        log.info("INIT", "No conversationId in URL — resolving public conversation.");
        currentConv = await getPublicConversation();
      }

      // Verify the resolved conversation is usable before doing anything else
      if (!currentConv?.id) {
        log.error("INIT", "Resolved conversation has no ID.", currentConv);
        throw new Error("Target conversation context could not be resolved.");
      }

      log.info("INIT", `Conversation resolved.`, { id: currentConv.id, name: currentConv.name });
      setConversation(currentConv);

      const [users, messagesPage, privateChats, privateNotifications] = await Promise.all([
        getOnlineUsers(),
        getConversationMessages(currentConv.id, 0),
        getUserConversations(user.id),
        getNotifications(user.id),
      ]);

      // Verify each parallel result
      log.info("INIT", `Online users fetched: ${users.length}`);
      log.info("INIT", `Messages fetched (page 0): ${messagesPage.content.length}`, {
        hasMore: messagesPage.content.length >= 30,
      });
      log.info("INIT", `Conversations in inbox: ${privateChats.content?.length ?? 0}`);
      log.info("INIT", `Notifications fetched: ${privateNotifications.length}`);

      // Warn if expected data is empty — helps catch backend issues early
      if (users.length === 0)               log.warn("INIT", "Online users list is empty.");
      if (!privateChats.content?.length)    log.warn("INIT", "No conversations returned for this user.");
      if (messagesPage.content.length === 0) log.warn("INIT", "No messages returned for this conversation on page 0.");

      const reversedChat = messagesPage.content.reverse();

      setOnlineUsers(users);
      setConversations(privateChats.content || []);
      setChat(reversedChat);
      setNotifications(privateNotifications);
      setHasMore(messagesPage.content.length >= 30);
      setPage(1);

      // Mark the conversation as read immediately after loading
      if (reversedChat.length > 0) {
        const lastMsg = reversedChat[reversedChat.length - 1];
        
        log.info("LAST_SEEN", `Marking initial read. Last message ID: ${lastMsg.id}`);
        await patchConversationLastSeen(currentConv.id, user.id, lastMsg.id);

        setConversations(prev =>
          prev.map(c =>
            c.id === currentConv.id
            ? { ...c, unreadCount: 0 }
            : c
          )
        );
        log.info("LAST_SEEN", "Initial read mark successful.");
      } else {
        log.info("LAST_SEEN", "No messages to mark as read on init.");
      }

    } catch (err) {
      log.error("INIT", "Chat initialization failed.", err);
    } finally {
      setPageLoading(false);
    }
  }, [user, conversationId]);

  useEffect(() => {
    if (user) fetchChatData();
  }, [user, conversationId, fetchChatData]);

  useEffect(() => {
    const handleWindowFocus = () => {
      if (document.hasFocus()) {
        log.info("LAST_SEEN", "Window focused — triggering read mark.");
        markConversationAsRead();
      }
    };
    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, [markConversationAsRead]);

  // ---------------------------------------------------
  // --------------- PAGINATION ------------------------
  // ---------------------------------------------------
  const loadMore = useCallback(async () => {
    if (loadingMore) {
      log.info("PAGINATION", "loadMore called while already loading — skipped.");
      return;
    }
    if (!hasMore) {
      log.info("PAGINATION", "No more pages to load.");
      return;
    }
    if (!conversation) {
      log.warn("PAGINATION", "loadMore called without an active conversation.");
      return;
    }

    log.info("PAGINATION", `Loading page ${page} for conversation #${conversation.id}`);
    setLoadingMore(true);

    try {
      const nextPage = await getConversationMessages(conversation.id, page);

      if (nextPage.content.length === 0) {
        log.info("PAGINATION", "No more messages — reached the beginning of history.");
        setHasMore(false);
        return;
      }

      log.info("PAGINATION", `Loaded ${nextPage.content.length} older messages.`);
      setChat((prev) => [...[...nextPage.content].reverse(), ...prev]);
      setPage((prev) => prev + 1);
    } catch (err) {
      log.error("PAGINATION", "Failed to load more messages.", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, conversation]);

  const { containerRef, onScroll } = useChatScroll(chat, loadMore);

  // ---------------------------------------------------
  // ----------------- SOCKET --------------------------
  // ---------------------------------------------------
  useEffect(() => {
    if (!user || !conversation) {
      log.warn("SOCKET", "Socket effect skipped — user or conversation not ready.", {
        userId: user?.id,
        conversationId: conversation?.id,
      });
      return;
    }

    log.info("SOCKET", `Subscribing to socket events for conversation #${conversation.id}`);

    const handleMessage = (msg: Message) => {
      // Verify the incoming message has the minimum fields we rely on
      if (!msg?.id || !msg?.conversationId) {
        log.warn("SOCKET", "Received malformed message — ignoring.", msg);
        return;
      }

      if (msg.conversationId === conversation.id) {
        log.info("SOCKET", `New message in active conversation. ID: ${msg.id}`);

        setChat((prev) => {
          const updatedChat = [...prev, msg];



          if (document.hasFocus()) {
            log.info("LAST_SEEN", `Window focused on incoming message — marking ID: ${msg.id} as seen.`);
            patchConversationLastSeen(user.id, msg.id, conversation.id)
              .catch((err) => log.error("LAST_SEEN", "Failed to patch last seen on incoming message.", err));
          }

          return updatedChat;
        });
      } else {
        log.info("SOCKET", `Message for background conversation #${msg.conversationId} — updating inbox.`);

        setConversations((prev) => {
          const exists = prev.some((c) => c.id === msg.conversationId);

          if (exists) {
            const targetRoom = prev.find((c) => c.id === msg.conversationId)!;
            const remaining = prev.filter((c) => c.id !== msg.conversationId);
            return [
              {
                ...targetRoom,
                unreadCount: (targetRoom.unreadCount || 0) + 1,
                lastMessage: msg.content,
              },
              ...remaining,
            ];
          } else {
            log.info("SOCKET", `Conversation #${msg.conversationId} not in inbox — creating new entry.`);
            const newRoom: ConversationListDto = {
              id: msg.conversationId,
              name: msg.sender?.username || `User #${msg.sender?.id ?? "Unknown"}`,
              lastMessage: msg.content,
              unreadCount: 1,
            };
            return [newRoom, ...prev];
          }
        });
      }
    };

    const handleUserJoin = (data: any) => {
      if (!data?.user) {
        log.warn("SOCKET", "user_join event received with no user payload.", data);
        return;
      }
      log.info("SOCKET", `User joined: ${data.user.username}`);
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.username === data.user.username)) return prev;
        return [...prev, data.user];
      });
    };

    const handleUserLeave = (data: any) => {
      if (!data?.user) {
        log.warn("SOCKET", "user_leave event received with no user payload.", data);
        return;
      }
      log.info("SOCKET", `User left: ${data.user.username}`);
      setOnlineUsers((prev) => prev.filter((u) => u.username !== data.user.username));
    };

  const handleNotification = (notif: NotificationDto) => {
    if (!notif?.id) {
      log.warn("SOCKET", "Received malformed notification — ignoring.", notif);
      return;
    }
    log.info("SOCKET", `New notification received. ID: ${notif.id}`);
    setNotifications((prev) => [notif, ...prev]);  // this updates TopMenu automatically
  };


    subscribe("message", handleMessage);
    subscribe("user_join", handleUserJoin);
    subscribe("user_leave", handleUserLeave);
    subscribe("notification", handleNotification);

    return () => {
      log.info("SOCKET", `Unsubscribing socket listeners for conversation #${conversation.id}`);
      unsubscribe("message", handleMessage);
      unsubscribe("user_join", handleUserJoin);
      unsubscribe("user_leave", handleUserLeave);
      unsubscribe("notification", handleNotification);
    };
  }, [user, conversation]);

  // ---------------------------------------------------
  // --------------- MESSAGE SEND ---------------------
  // ---------------------------------------------------
  const handleSend = async () => {
    if (!canSend) {
      log.warn("SEND", "handleSend called with nothing to send.");
      return;
    }
    if (!conversation || !user) {
      log.warn("SEND", "handleSend called without conversation or user context.", {
        conversationId: conversation?.id,
        userId: user?.id,
      });
      return;
    }

    log.info("SEND", `Sending message to conversation #${conversation.id}`, {
      hasText: text.trim().length > 0,
      fileCount: selectedFiles.length,
    });

    try {
      await sendMessage(user.id, conversation.id, text, selectedFiles);
      setText("");
      setSelectedFiles([]);
      log.info("SEND", "Message sent successfully.");
    } catch (err) {
      log.error("SEND", "Failed to send message.", err);
    }
  };

  // ---------------------------------------------------
  // --------------- RENDER GUARDS --------------------
  // ---------------------------------------------------
  if (loading || !user) {
    return <div className={styles.appSpinnerView}>Synchronizing authorization session tokens...</div>;
  }

  if (pageLoading) {
    return <div className={styles.appSpinnerView}>Loading chat resources and historical frames...</div>;
  }

  return (
    <div className={styles.masterWrapper}>
      <TopMenu
        user={user}
        conversations={conversations}
        notifications={notifications}
        onNotificationRead={(targetId) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === targetId ? { ...n, status: "OPENED" } : n))
          );
        }}
      />

      <div className={styles.container}>
        <Sidebar
          user={user}
          onlineUsers={onlineUsers}
          onRefresh={fetchChatData}
          className={styles.sidebar}
        />

        <div className={styles.chatSection}>
          <div className={styles.activeChannelBanner}>
            {conversationId ? (
              <span><strong>@{conversation?.name || "Loading Context..."}</strong></span>
            ) : (
              <span>🌐 Public Global Chatroom Arena</span>
            )}
          </div>

          {loadingMore && (
            <div className={styles.loadingMoreIndicator}>Fetching previous history layers...</div>
          )}

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
