import { useEffect, useState, useCallback } from "react"

import OnlineUsers from "../components/OnlineUsers"
import MessageInput from "../components/MessageInput"
import PublicChat from "../components/PublicChat"

import { connectSocket } from "../services/socket.service"
import { login, getMe } from "../services/jwt.service"
import { getOnlineUsers, logoutUser } from "../services/user.service"
import { getPublicMessages, sendMessage } from "../services/message.service"

import type { User } from "../models/user"
import type { Message } from "../models/message"
import type { AuthResponse } from "../services/jwt.service"
import { useChatScroll } from "../hook/useChatScroll"

const createUsername = () => {
  const random = Math.random().toString(36).substring(2, 10)
  return `USER-${random}`
}

export default function PublicChatPage() {

  const [user, setUser] = useState<User | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [chat, setChat] = useState<Message[]>([])

  const [text, setText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [socketReady, setSocketReady] = useState(false)
  const [page, setPage] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)  

  // INIT
  useEffect(() => {
    const init = async () => {
      let stored = localStorage.getItem("user")
      let username: string

      if (stored) {
        username = JSON.parse(stored).username
      } else {
        username = createUsername()
        localStorage.setItem("user", JSON.stringify({ username }))
      }

      try {
        const res: AuthResponse = await getMe()
        localStorage.setItem("token", res.token)
        setUser(res.user)
      } catch {
        const res: AuthResponse = await login(username)
        localStorage.setItem("token", res.token)
        setUser(res.user)
      }

      try {
        const [users, messagesPage] = await Promise.all([
          getOnlineUsers(),
          getPublicMessages()
        ])

        setOnlineUsers(users)        
        setChat(messagesPage.content.reverse())
        setPage(1)

        // ako ima manje od 30 → nema više
        if (messagesPage.content.length < 30) {
          setHasMore(false)
        }

      } catch (err) {
        console.error("❌ INIT ERROR:", err)
      }
    }

    init()
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)

    try {
      const nextPage = await getPublicMessages(page)

      if (nextPage.content.length === 0) {
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
  
  // SOCKET
  useEffect(() => {
    if (!user) return

    const token = localStorage.getItem("token")
    if (!token) return

    connectSocket(token, {
      onChatMessage: (msg) => {
        setChat((prev) => [...prev, msg])
      },
      onUserJoin: (newUser: User) => {
        setOnlineUsers((prev) => {
          const exists = prev.some(u => u.username === newUser.username)
          if (exists) return prev

        return [...prev, newUser]
        })
      },      
      onUserLeave: (leftUser: User) => {
        setOnlineUsers((prev) =>
          prev.filter(u => u.username !== leftUser.username)
        )
      }  
    })

    setSocketReady(true)
  }, [user])

  // CLOSE
  useEffect(() => {
    const handleClose = () => {
      if (!user) return
      logoutUser(user)
    }

    window.addEventListener("beforeunload", handleClose)
    return () => window.removeEventListener("beforeunload", handleClose)
  }, [user])

  const handleSend = () => {
    if (!user || !socketReady) return
    
    sendMessage(user.username, null, text, selectedFile)

    setText("")
    setSelectedFile(null)
  }

  if (!user) return <div>Loading...</div>

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      <div style={{ width: 250, borderRight: "1px solid #ddd" }}>
        <div style={{ padding: "12px", fontWeight: "bold" }}>
          👤 {user.username}
        </div>

        <OnlineUsers
          users={onlineUsers}
          currentUser={user}
        />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        <PublicChat
          currentUser={user}
          messages={chat}
          containerRef={containerRef}
          onScroll={onScroll}
        />

        <MessageInput
          text={text}
          file={selectedFile}
          onTextChange={setText}
          onFileSelect={setSelectedFile}
          onSend={handleSend}
        />

      </div>

    </div>
  )
}