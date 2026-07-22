// ChatDashboardPage.tsx
import styles from "./ChatDashboardPage.module.css";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import MessageInput from "../../components/MessageInput/MessageInput";
import Chat from "../../components/Chat/Chat";
import Sidebar from "../../components/Sidebar/Sidebar";
import TopMenu from "../../components/TopMenu/TopMenu";

import { subscribe, unsubscribe } from "../../services/socket.service";
import { getOnlineUsers } from "../../services/user.service";
import { getMessagesBefore, getMessageWindow, sendMessage } from "../../services/message.service";
import { getConversation, getLastSeenMessageId, getPublicConversation, patchConversationLastSeen } from "../../services/conversation.service";

import type { UserModel } from "../../models/user";
import type { Message } from "../../models/message";
import type { Conversation } from "../../models/conversation";

import { useChatScroll } from "../../hooks/useChatScroll";
import { useAuth } from "../../context/AuthContext";
import { useInbox } from "../../hooks/useInbox";

const IS_DEV = import.meta.env.DEV;

const log = {
  info:  (tag: string, msg: string, data?: unknown) => IS_DEV && console.log(`[${tag}] ${msg}`, data ?? ""),
  warn:  (tag: string, msg: string, data?: unknown) => IS_DEV && console.warn(`[${tag}] ⚠️ ${msg}`, data ?? ""),
  error: (tag: string, msg: string, data?: unknown) => console.error(`[${tag}] ❌ ${msg}`, data ?? ""),
};

export default function ChatDashboardPage() {
  const { user, loading } = useAuth();
  const { conversationId } = useParams<{ conversationId?: string }>();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserModel[]>([]);
  const [chat, setChat] = useState<Message[]>([]);

  const { conversations, setConversations, notifications, setNotifications, refresh: refreshInbox } =
    useInbox(user, conversation?.id);

  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const canSend = text.trim().length > 0 || selectedFiles.length > 0;

  const [pageLoading, setPageLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [initialFocusMessageId, setInitialFocusMessageId] = useState<number | null>(null);
  const isAtBottomRef = useRef(true);
  const [showSettings, setShowSettings] = useState(false);

  // ---------------------------------------------------
  // ------------ LAST SEEN TRACKING -------------------
  // ---------------------------------------------------
  const markConversationAsRead = useCallback(async (currentChatList = chat) => {
    if (!conversation?.id || !user) return;
    if (currentChatList.length === 0) return;

    const lastMsg = currentChatList[currentChatList.length - 1];

    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c))
    );

    try {
      await patchConversationLastSeen(conversation.id, user.id, lastMsg.id);
    } catch (err) {
      log.error("LAST_SEEN", "Failed to update last seen.", err);
    }
  }, [conversation?.id, user, chat, setConversations]);

  // ---------------------------------------------------
  // ----------------- INIT ----------------------------
  // ---------------------------------------------------
  const fetchChatData = useCallback(async () => {
  if (!user) return;
  setPageLoading(true);
  try {
    let currentConv: Conversation | null = conversationId
      ? await getConversation(Number(conversationId))
      : await getPublicConversation();

    if (!currentConv?.id) throw new Error("Target conversation context could not be resolved.");
    setConversation(currentConv);

    const [users, lastSeenMessageId] = await Promise.all([
      getOnlineUsers(),
      getLastSeenMessageId(currentConv.id),
    ]);

    const win = await getMessageWindow(currentConv.id, lastSeenMessageId || undefined);

    setOnlineUsers(users);
    setChat(win.messages);
    setHasMore(win.hasMoreOlder);
    setInitialFocusMessageId(lastSeenMessageId && lastSeenMessageId > 0 ? lastSeenMessageId : null);
    // Deliberately NOT calling patchConversationLastSeen here — we don't want
    // to burn the last-seen position before the user has actually scrolled
    // there. It gets updated once isAtBottom becomes true (see effect below).
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
      if (document.hasFocus()) markConversationAsRead();
    };
    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, [markConversationAsRead]);

  // ---------------------------------------------------
  // --------------- PAGINATION ------------------------
  // ---------------------------------------------------
  const loadMore = useCallback(async () => {
  if (loadingMore || !hasMore || !conversation || chat.length === 0) return;
  setLoadingMore(true);
  try {
    const oldestId = chat[0].id;
    const older = await getMessagesBefore(conversation.id, oldestId, 30);
    if (older.length === 0) {
      setHasMore(false);
      return;
    }
    setChat((prev) => [...older, ...prev]);
    setHasMore(older.length >= 30);
  } catch (err) {
    log.error("PAGINATION", "Failed to load more messages.", err);
  } finally {
    setLoadingMore(false);
  }
}, [chat, loadingMore, hasMore, conversation]);

  const { containerRef, onScroll, isAtBottom, scrollToBottom } =
    useChatScroll(chat, loadMore, initialFocusMessageId);

  useEffect(() => { isAtBottomRef.current = isAtBottom; }, [isAtBottom]);

  // Clear the unread badge only once the user actually reaches the bottom
  useEffect(() => {
    if (isAtBottom && chat.length > 0) {
      markConversationAsRead();
    }
  }, [isAtBottom, chat.length, markConversationAsRead]);

  // ---------------------------------------------------
  // ----------------- SOCKET --------------------------
  // ---------------------------------------------------
  // Only what's local to *this* chat window: appending live messages for the
  // active conversation, and presence. Everything TopMenu needs (unread
  // conversation badges, notifications) is handled by useInbox above.
  useEffect(() => {
    if (!user || !conversation) return;

    const handleMessage = (msg: Message) => {
      if (!msg?.id || !msg?.conversationId) return;
      if (msg.conversationId !== conversation.id) return;

      setChat((prev) => {
        if (document.hasFocus() && isAtBottomRef.current) {
          patchConversationLastSeen(conversation.id, user.id, msg.id)
            .catch((err) => log.error("LAST_SEEN", "Failed to patch last seen on incoming message.", err));
        }
        return [...prev, msg];
      });
    };

    const handleUserJoin = (data: any) => {
      if (!data?.user) return;
      setOnlineUsers((prev) =>
        prev.some((u) => u.username === data.user.username) ? prev : [...prev, data.user]
      );
    };

    const handleUserLeave = (data: any) => {
      if (!data?.user) return;
      setOnlineUsers((prev) => prev.filter((u) => u.username !== data.user.username));
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

  // ---------------------------------------------------
  // --------------- MESSAGE SEND ---------------------
  // ---------------------------------------------------
  const handleSend = async () => {
    if (!canSend || !conversation || !user) return;

    try {
      await sendMessage(user.id, conversation.id, text, selectedFiles);
      setText("");
      setSelectedFiles([]);
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
        onNotificationRemove={(targetId) => {
          setNotifications((prev) => prev.filter((n) => n.id !== targetId));
        }}
      />

      <div className={styles.container}>
        <Sidebar
          user={user}
          onlineUsers={onlineUsers}
          onRefresh={async () => {
            await fetchChatData();
            await refreshInbox();
          }}
          className={styles.sidebar}
        />

        <div className={styles.chatSection}>
          {loadingMore && (
            <div className={styles.loadingMoreIndicator}>Fetching previous history layers...</div>
          )}

          <div className={styles.chatMessages}>
            <Chat
              currentUser={user}
              conversation={conversation}
              isPublic={!conversationId}
              messages={chat}
              containerRef={containerRef}
              onScroll={onScroll}
              isAtBottom={isAtBottom}
              scrollToBottom={scrollToBottom}
              onConversationUpdated={(patch) =>
                setConversation((prev) => (prev ? { ...prev, ...patch } : prev))
              }
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