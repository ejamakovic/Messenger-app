import { useParams } from "react-router-dom"
import MessageInput from "../components/MessageInput"
import { connectSocket } from "../services/socket.service"
import { useCallback, useEffect, useState } from "react"
import { getOnlineUsers, logoutUser } from "../services/user.service"
import { getAllPrivateChats, getPrivateMessages, getPublicMessages, sendMessage } from "../services/message.service"
import type { Message } from "../models/message"
import type { User } from "../models/user"
import { useChatScroll } from "../hook/useChatScroll"
import TopMenu from "../components/TopMenu"
import PublicChat from "../components/PublicChat"

export default function PrivateChatPage() {
  const { receiver } = useParams<{ receiver: string }>()
  
  if (!receiver) return <div>Invalid chat</div>

  const [socketReady, setSocketReady] = useState(false)  
  const user = JSON.parse(localStorage.getItem("user") || "null")
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [chat, setChat] = useState<Message[]>([])

  const [text, setText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)  

useEffect(() => {
  const init = async () => {
    try {
      const [users, messagesPage, chats] = await Promise.all([
        getOnlineUsers(),
        getPrivateMessages(user.username, receiver),
        getAllPrivateChats(user.username)
      ])

      setOnlineUsers(users)
      setChat(messagesPage.content.reverse())
      setPage(1)

      setConversations(chats.content || [])
      console.log("CHAT:\n" + conversations)

      if (messagesPage.content.length < 30) {
        setHasMore(false)
      }

    } catch (err) {
      console.error("❌ INIT ERROR:", err)
    }
  }

  if (user?.username && receiver) {
    init()
  }
}, [receiver])

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
            if((msg.sender?.username === receiver && msg.receiver?.username === user.username) || (msg.sender?.username === user.username && msg.receiver?.username === receiver)){
              setChat((prev) => [...prev, msg])
            }
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
      }, [user?.username])
  

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
    
    sendMessage(user.username, receiver, text, selectedFile)

    setText("")
    setSelectedFile(null)
  }

  return (
    <div>
      <h3>Chat with {receiver}</h3>

      <TopMenu
        conversations={conversations}
        notifications={notifications}        
      />

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