import { useParams } from "react-router-dom"
import PrivateChat from "../components/PrivateChat"
import MessageInput from "../components/MessageInput"
import { connectSocket, sendMessage } from "../services/socket.service"
import { useCallback, useEffect, useState } from "react"
import { getOnlineUsers } from "../services/user.service"
import { getPrivateMessages, getPublicMessages } from "../services/message.service"
import type { Message } from "../models/message"
import type { User } from "../models/user"
import { useChatScroll } from "../hook/useChatScroll"

export default function PrivateChatPage() {
  const { receiver } = useParams<{ receiver: string }>()
  
  if (!receiver) return <div>Invalid chat</div>

  const [socketReady, setSocketReady] = useState(false)
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "null")
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [chat, setChat] = useState<Message[]>([])

  const [page, setPage] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)  

  useEffect(()=> {
    const init = async() => {
      
            try {
              const [users, messagesPage] = await Promise.all([
                getOnlineUsers(),
                getPrivateMessages(user.username, receiver)
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
  })

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
  

  // SEND
  const handleSend = (text: string) => {
    if (!user || !socketReady) return

    sendMessage({
      type: "message",
      sender: user.username,
      receiver: receiver,
      content: text,
    })
  }

  return (
    <div>
      <h3>Chat with {receiver}</h3>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      
              <PrivateChat
                currentUser={user}
                messages={chat}
                containerRef={containerRef}
                onScroll={onScroll}
              />
      
              <MessageInput onSend={handleSend} />
      
            </div>
    </div>
  )
}