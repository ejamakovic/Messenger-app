import { useParams, useNavigate } from "react-router-dom"
import MessageInput from "../components/MessageInput/MessageInput"
import { useCallback, useEffect, useState } from "react"
import { getConversationMessages, sendMessage } from "../services/message.service"
import { logoutUser } from "../services/user.service"
import { subscribe, unsubscribe } from "../services/socket.service"
import type { Message } from "../models/message"
import { useChatScroll } from "../hook/useChatScroll"
import TopMenu from "../components/TopMenu"
import PublicChat from "../components/Chat/PublicChat"
import { getUserConversations } from "../services/conversation.service"

export default function PrivateChatPage() {
  // FIX: Read parameter context as conversationId matching your TopMenu design
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  
  if (!conversationId) return <div>Invalid chat room selection</div>

  const user = JSON.parse(sessionStorage.getItem("user") || "null")  
  const [chat, setChat] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [conversations, setConversations] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])

  const [page, setPage] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)  

  const numericConvId = Number(conversationId)

  // INITIALIZATION LOGIC
  useEffect(() => {
    const init = async () => {
      try {
        // Reset local layout variables before pulling next data collection
        setChat([])
        setPage(0)
        setHasMore(true)

        const [messagesPage, chats] = await Promise.all([        
          getConversationMessages(numericConvId, 0),
          getUserConversations(user.id)
        ])
        
        setChat(messagesPage.content.reverse())
        setPage(1)
        setConversations(chats.content || [])

        if (messagesPage.content.length < 30) {
          setHasMore(false)
        }
      } catch (err) {
        console.error("❌ INIT ERROR:", err)
      }
    }

    if (user?.username && conversationId) {
      init()
    }
  }, [conversationId]) // Triggers reload if dropdown switches channels

  // PAGINATION LOGIC
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !user?.username) return
  
    setLoadingMore(true)
  
    try {
      const nextPage = await getConversationMessages(numericConvId, page)
  
      if (!nextPage.content || nextPage.content.length === 0) {
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
  }, [page, loadingMore, hasMore, conversationId, user?.username])
  
  const { containerRef, onScroll } = useChatScroll(chat, loadMore)

  // SOCKET MANAGEMENT
  useEffect(() => {
    if (!user || !conversationId) return

    const handleMessage = (msg: Message) => {
      // FIX: Matches directly against numeric conv validation properties
      if (msg.conversationId === numericConvId) {
        setChat((prev) => [...prev, msg])
      }
    }

    subscribe("message", handleMessage)

    return () => {
      unsubscribe("message", handleMessage)
    }
  }, [user, conversationId])
  
  // WINDOW CLOSURE HANDLERS
  useEffect(() => {
    const handleClose = () => {
      if (!user) return
      logoutUser(user)
    }

    window.addEventListener("beforeunload", handleClose)
    return () => window.removeEventListener("beforeunload", handleClose)
  }, [user])
      
  // SEND MESSAGE LOGIC
  const handleSend = async () => {
    if (!user || (!text.trim() && !selectedFile)) return
    
    try {
      // FIX: Passing matching parameter sets: user.id and target conversationId array
      const filesArray = selectedFile ? [selectedFile] : []
      await sendMessage(user.id, numericConvId, text, filesArray)
      
      setText("")
      setSelectedFile(null)
    } catch (err) {
      console.error("❌ MESSAGE DISPATCH ERROR:", err)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopMenu
        conversations={conversations}
        notifications={notifications}        
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button 
            onClick={() => navigate("/")} 
            style={{ padding: "5px 10px", cursor: "pointer" }}
          >
            ← Back to Public Room
          </button>
          <h3>Private Chat Room #{conversationId}</h3>
        </div>
      
        <div style={{ flex: 1, overflowY: "auto", margin: "15px 0" }}>
          <PublicChat
            currentUser={user}        
            messages={chat}
            containerRef={containerRef}
            onScroll={onScroll}
          />
        </div>

        <MessageInput
          text={text}
          file={selectedFile ? [selectedFile] : []} // Normalizing to array for subcomponents
          canSend={text.trim().length > 0 || !!selectedFile}
          onTextChange={setText}
          onFileSelect={(files: any[]) => setSelectedFile(files?.[0] || null)}
          onSend={handleSend}
        />
      </div>
    </div>
  )
}