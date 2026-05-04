import { API_URL } from "./api"
let socket: WebSocket | null = null

export const connectSocket = (username: any, onMessage: (msg: any) => void) => {
  socket = new WebSocket(API_URL + "/ws/chat")

  socket.onopen = () => {
    socket!.send(JSON.stringify({
      type: "init",      
      username: username
    }))
  }

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    onMessage(data)
  }

  socket.onclose = () => {
    console.log("Socket closed")
  }
}

export const sendMessage = (msg: any) => {
  if (!socket) return
  socket.send(JSON.stringify(msg))
}