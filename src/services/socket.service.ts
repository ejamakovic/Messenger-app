let socket: WebSocket | null = null

type Handlers = {
  onChatMessage?: (msg: any) => void
  onUserJoin?: (user: any) => void
  onChatRequest?: (req: any) => void
}

export const connectSocket = (token: string, handlers: Handlers) => {
  socket = new WebSocket(`ws://localhost:8080/ws/chat?token=${token}`)

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)

    switch (data.type) {

      case "chat":
        handlers.onChatMessage?.(data)
        break

      case "user":
        handlers.onUserJoin?.(data.user)
        break

      case "chatRequest":
        handlers.onChatRequest?.(data)
        break

      default:
        console.log("Unknown event:", data)
    }
  }
}

export const sendMessage = (msg: any) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify(msg))
}