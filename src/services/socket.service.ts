let socket: WebSocket | null = null

type SocketEvent =
  | "message"
  | "user_join"
  | "user_leave"
  | "notification"

type Listener = (data: any) => void

const listeners: Record<SocketEvent, Set<Listener>> = {
  message: new Set(),
  user_join: new Set(),
  user_leave: new Set(),  
  notification: new Set(),
}

export const connectSocket = (token: string) => {

  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ) {
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
  const { type, ...payload } = JSON.parse(event.data)

  const eventListeners = listeners[type as SocketEvent]

  if (!eventListeners) {
    console.log("UNKNOWN EVENT:", type)
    return
  }

  eventListeners.forEach((listener) => listener(payload))
}

  return socket
}

export const disconnectSocket = () => {

  if (socket) {
    socket.close()
    socket = null
  }
}

export const subscribe = (
  event: SocketEvent,
  callback: Listener
) => {

  listeners[event].add(callback)
}

export const unsubscribe = (
  event: SocketEvent,
  callback: Listener
) => {

  listeners[event].delete(callback)
}

export const emit = (data: any) => {

  if (!socket) return

  if (socket.readyState !== WebSocket.OPEN) {
    return
  }

  socket.send(JSON.stringify(data))
}