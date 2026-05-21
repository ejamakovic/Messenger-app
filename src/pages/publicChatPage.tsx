import styles from "../styles/PublicChatPage.module.css";

import {
  useEffect,
  useState,
  useCallback,
} from "react";

import OnlineUsers from "../components/OnlineUsers";
import MessageInput from "../components/MessageInput/MessageInput";
import PublicChat from "../components/Chat/PublicChat";

import {
  subscribe,
  unsubscribe,
} from "../services/socket.service";

import {
  getOnlineUsers,
  logoutUser,
} from "../services/user.service";

import {
  getConversationMessages,
  sendMessage,
} from "../services/message.service";

import {
  getPublicConversation,
} from "../services/conversation.service";

import type { User } from "../models/user";
import type { Message } from "../models/message";
import type { Conversation } from "../models/conversation";

import { useChatScroll } from "../hook/useChatScroll";
import { useAuth } from "../context/AuthContext";

export default function PublicChatPage() {

  const { user, loading } = useAuth();

  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [onlineUsers, setOnlineUsers] =
    useState<User[]>([]);

  const [chat, setChat] =
    useState<Message[]>([]);

  const [text, setText] =
    useState("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [page, setPage] =
    useState(0);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [hasMore, setHasMore] =
    useState(true);

  const canSend =
    text.trim().length > 0 ||
    selectedFiles.length > 0;

  // INITIAL DATA

  useEffect(() => {

    const init = async () => {

      try {

        const publicConversation =
          await getPublicConversation();
 
        if (!publicConversation?.id) {
          throw new Error(
            "Public conversation not found"
          );
        }
        
        setConversation(
          publicConversation
        );

        const [
          users,
          messagesPage,
        ] = await Promise.all([
          getOnlineUsers(),

          getConversationMessages(
            publicConversation.id,
            page
          ),
        ]);

        setOnlineUsers(users);

        setChat(
          messagesPage.content.reverse()
        );    

        if (
          messagesPage.content.length < 30
        ) {
          setHasMore(false);
        }

      } catch (err) {

        console.error(
          "INIT ERROR:",
          err
        );
      }
    };

    init();
    setPage((prev) => prev + 1);

  }, []);

  // LOAD MORE

  const loadMore = useCallback(async () => {

    if (
      loadingMore ||
      !hasMore ||
      !conversation
    ) {
      return;
    }

    setLoadingMore(true);  

    try {

      const nextPage =
        await getConversationMessages(
          conversation.id,
          page
        );

      if (
        nextPage.content.length === 0
      ) {
        setHasMore(false);
        return;
      }

      setChat((prev) => [
        ...nextPage.content.reverse(),
        ...prev,
      ]);

      setPage((prev) => prev + 1);

    } catch (err) {

      console.error(
        "LOAD MORE ERROR:",
        err
      );

    } finally {

      setLoadingMore(false);
    }

  }, [
    page,
    loadingMore,
    hasMore,
    conversation,
  ]);

  const {
    containerRef,
    onScroll,
  } = useChatScroll(chat, loadMore);

  // SOCKET EVENTS

  useEffect(() => {

    if (!user || !conversation) {
      return;
    }

    const handleMessage = (
      msg: Message
    ) => {

      if (
        msg.conversationId ===
        conversation.id
      ) {

        setChat((prev) => [
          ...prev,
          msg,
        ]);
      }
    };

    const handleUserJoin = (
      data: any
    ) => {

      const newUser = data.user;

      setOnlineUsers((prev) => {

        const exists = prev.some(
          (u) =>
            u.username ===
            newUser.username
        );

        if (exists) {
          return prev;
        }

        return [...prev, newUser];
      });
    };

    const handleUserLeave = (
      data: any
    ) => {

      const leftUser = data.user;

      setOnlineUsers((prev) =>
        prev.filter(
          (u) =>
            u.username !==
            leftUser.username
        )
      );
    };

    subscribe(
      "message",
      handleMessage
    );

    subscribe(
      "user_join",
      handleUserJoin
    );

    subscribe(
      "user_leave",
      handleUserLeave
    );

    return () => {

      unsubscribe(
        "message",
        handleMessage
      );

      unsubscribe(
        "user_join",
        handleUserJoin
      );

      unsubscribe(
        "user_leave",
        handleUserLeave
      );
    };

  }, [user, conversation]);

  // TAB CLOSE

  useEffect(() => {

    const handleClose = () => {

      if (!user) {
        return;
      }

      logoutUser(user);
    };

    window.addEventListener(
      "beforeunload",
      handleClose
    );

    return () => {

      window.removeEventListener(
        "beforeunload",
        handleClose
      );
    };

  }, [user]);

  // SEND MESSAGE
const handleSend = async () => {
  
  if (!canSend) {
    return;
  }

  if (!conversation || !user) return;

  try {
    await sendMessage(
      user.id,
      conversation.id,
      text,           
      selectedFiles
    );

    setText("");
    setSelectedFiles([]);

  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
  }
};

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>

      <div className={styles.sidebar}>

        <div className={styles.sidebarHeader}>
          👤 {user.username}
        </div>

        <OnlineUsers
          users={onlineUsers}
          currentUser={user}
        />

      </div>

      <div className={styles.chatSection}>

        {loadingMore && (
          <div className={styles.loadingMore}>
            Loading more...
          </div>
        )}

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