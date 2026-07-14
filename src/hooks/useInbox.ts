// hooks/useInbox.ts
import { useState, useEffect, useCallback } from "react";
import { subscribe, unsubscribe } from "../services/socket.service";
import { getUserConversations } from "../services/conversation.service";
import { getNotifications } from "../services/notification.service";
import type { ConversationListDto } from "../models/conversationListDto";
import type { NotificationDto } from "../models/notification";
import type { Message } from "../models/message";
import type { UserModel } from "../models/user";

/**
 * Everything TopMenu needs: the conversations list (chats dropdown / unread
 * badge) and notifications (bell dropdown). Fetches the initial snapshot and
 * keeps both in sync over the socket, so any page rendering <TopMenu /> gets
 * live updates without re-implementing subscribe/unsubscribe itself.
 *
 * @param activeConversationId - if the user is currently viewing this
 * conversation, incoming messages for it are skipped here — the chat page
 * owns appending them to the message list and marking them as read.
 */
export function useInbox(user: UserModel | null, activeConversationId?: number) {
  const [conversations, setConversations] = useState<ConversationListDto[]>([]);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [convs, notifs] = await Promise.all([
        getUserConversations(user.id),
        getNotifications(user.id),
      ]);
      setConversations(convs.content || []);
      setNotifications(notifs);
    } catch (err) {
      console.error("[INBOX] Failed to load conversations/notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;

    const handleMessage = (msg: Message) => {
      if (!msg?.id || !msg?.conversationId) return;
      if (msg.conversationId === activeConversationId) return; // owned by the chat page

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === msg.conversationId);

        if (exists) {
          const room = prev.find((c) => c.id === msg.conversationId)!;
          const rest = prev.filter((c) => c.id !== msg.conversationId);
          return [
            { ...room, unreadCount: (room.unreadCount || 0) + 1, lastMessage: msg.content },
            ...rest,
          ];
        }

        const newRoom: ConversationListDto = {
          id: msg.conversationId,
          name: msg.sender?.username || `User #${msg.sender?.id ?? "Unknown"}`,
          lastMessage: msg.content,
          unreadCount: 1,
        };
        return [newRoom, ...prev];
      });
    };

    const handleNotification = (notif: NotificationDto) => {
      if (!notif?.id) return;
      setNotifications((prev) => [notif, ...prev]);
    };

    subscribe("message", handleMessage);
    subscribe("notification", handleNotification);

    return () => {
      unsubscribe("message", handleMessage);
      unsubscribe("notification", handleNotification);
    };
  }, [user, activeConversationId]);

  return { conversations, setConversations, notifications, setNotifications, loading, refresh };
}