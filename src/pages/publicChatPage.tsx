import styles from "../styles/PublicChatPage.module.css"

import {
  useEffect,
  useState,
  useCallback
} from "react"

import OnlineUsers from "../components/OnlineUsers"
import MessageInput from "../components/MessageInput"
import PublicChat from "../components/PublicChat"


import {
  subscribe,
  unsubscribe
} from "../services/socket.service"

import {
  getOnlineUsers,
  logoutUser
} from "../services/user.service"

import {
  getPublicMessages,
  sendMessage
} from "../services/message.service"

import type { User } from "../models/user"
import type { Message } from "../models/message"

import { useChatScroll } from "../hook/useChatScroll"
import { useAuth } from "../context/AuthContext"

export default function PublicChatPage() {

  const { user, loading } = useAuth()

  const [onlineUsers, setOnlineUsers] =
    useState<User[]>([])

  const [chat, setChat] =
    useState<Message[]>([])

  const [text, setText] =
    useState("")

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)

  const [page, setPage] =
    useState(0)

  const [loadingMore, setLoadingMore] =
    useState(false)

  const [hasMore, setHasMore] =
    useState(true)
  


  // INITIAL DATA

  useEffect(() => {

    const init = async () => {

      try {

        const [
          users,
          messagesPage
        ] = await Promise.all([
          getOnlineUsers(),
          getPublicMessages()
        ])

        setOnlineUsers(users)

        setChat(
          messagesPage.content.reverse()
        )

        setPage(1)

        if (messagesPage.content.length < 30) {
          console.log("ima manje")
          setHasMore(false)
        }

      } catch (err) {

        console.error(
          "INIT ERROR:",
          err
        )
      }
    }

    init()

  }, [])

const loadMore = useCallback(async () => {
  console.log("📄 loadMore pozvan, page =", page)

  if (loadingMore || !hasMore) return

  setLoadingMore(true)

  try {
    const nextPage = await getPublicMessages(page)

    console.log("📦 dobio page:", page)

    if (nextPage.content.length === 0) {
      console.log("🛑 nema više poruka")
      setHasMore(false)
      return
    }

    setChat((prev) => [
      ...nextPage.content.reverse(),
      ...prev
    ])

    setPage((p) => p + 1)

  } catch (err) {
    console.error("LOAD MORE ERROR:", err)
  } finally {
    setLoadingMore(false)
  }
}, [page, loadingMore, hasMore])

  const { containerRef, onScroll } = useChatScroll(chat, loadMore)
  
  // SOCKET EVENTS

  useEffect(() => {

    if (!user) return

 const handleMessage = (msg: Message) => {
  
  if (msg.receiver?.username == null) {
    setChat((prev) => {      
      return [...prev, msg]
    })
  } else {
    console.log("❌ FILTERED OUT (not public)")
  }
}

    const handleUserJoin = (
      data: any
    ) => {

      const newUser = data.user

      setOnlineUsers((prev) => {

        const exists = prev.some(
          (u) =>
            u.username ===
            newUser.username
        )

        if (exists) return prev

        return [...prev, newUser]
      })
    }

    const handleUserLeave = (
      data: any
    ) => {

      const leftUser = data.user

      setOnlineUsers((prev) =>
        prev.filter(
          (u) =>
            u.username !==
            leftUser.username
        )
      )
    }

    subscribe(
      "message",
      handleMessage
    )

    subscribe(
      "user_join",
      handleUserJoin
    )

    subscribe(
      "user_leave",
      handleUserLeave
    )

    return () => {

      unsubscribe(
        "message",
        handleMessage
      )

      unsubscribe(
        "user_join",
        handleUserJoin
      )

      unsubscribe(
        "user_leave",
        handleUserLeave
      )
    }

  }, [user])

  // TAB CLOSE

  useEffect(() => {

    const handleClose = () => {

      if (!user) return

      logoutUser(user)
    }

    window.addEventListener(
      "beforeunload",
      handleClose
    )

    return () => {

      window.removeEventListener(
        "beforeunload",
        handleClose
      )
    }

  }, [user])

  // SEND MESSAGE

  const handleSend = async () => {

    if (!user) return

    try {

      await sendMessage(
        user.username,
        null,
        text,
        selectedFile
      )

      setText("")
      setSelectedFile(null)

    } catch (err) {

      console.error(
        "SEND MESSAGE ERROR:",
        err
      )
    }
  }

  if (loading || !user) {
    return <div>Loading...</div>
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
        file={selectedFile}
        onTextChange={setText}
        onFileSelect={setSelectedFile}
        onSend={handleSend}
      />
    </div>

  </div>

</div>
)
}