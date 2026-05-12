let socket: WebSocket | null = null

type Handlers = {
  onChatMessage?: (msg: any) => void
  onUserJoin?: (user: any) => void
  onChatRequest?: (req: any) => void
  onUserLeave?: (user: any) => void
}

export const connectSocket = (
  token: string,
  handlers: Handlers
) => {
  
  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ) {
    console.log("SOCKET ALREADY CONNECTED")
    return socket
  }

  socket = new WebSocket(
    `ws://localhost:8080/ws/chat?token=${token}`
  )

  socket.onopen = () => {
    console.log("✅ SOCKET CONNECTED")
  }

  socket.onclose = () => {
    console.log("❌ SOCKET CLOSED")
    socket = null
  }

  socket.onerror = (err) => {
    console.error("SOCKET ERROR", err)
  }

  socket.onmessage = (event) => {

    const data = JSON.parse(event.data)

    switch (data.type) {

      case "message":
        handlers.onChatMessage?.(data)
        break

      case "user":
        handlers.onUserJoin?.(data.user)
        break

      case "chatRequest":
        handlers.onChatRequest?.(data)
        break

      case "user_leave":
        handlers.onUserLeave?.(data)
        break

      default:
        console.log("Unknown event:", data)
    }
  }

  return socket
}

export const disconnectSocket = () => {

  if (socket) {
    socket.close()
    socket = null
  }
}

export const sendMessage = (msg: any) => {

  if (!socket) {
    console.log("NO SOCKET")
    return
  }

  if (socket.readyState !== WebSocket.OPEN) {
    console.log("SOCKET NOT OPEN")
    return
  }

  socket.send(JSON.stringify(msg))
}