let socket: WebSocket | null = null

export const connectSocket = (
  onMessage: (msg: any) => void
) => {
  socket = new WebSocket("ws://localhost:8080/ws/chat")

  socket.onopen = () => {
    console.log("🔥 WS CONNECTED")
  }

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    onMessage(data)
  }

  socket.onclose = () => {
    console.log("❌ WS CLOSED")
  }
}

export const sendMessage = (msg: any) => {
  if (!socket || socket.readyState !== 1) return

  socket.send(JSON.stringify(msg))
}