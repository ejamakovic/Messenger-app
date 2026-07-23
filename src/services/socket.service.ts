// socket.service.ts
let socket: WebSocket | null = null;

type Listener = (data: any) => void;

export type SocketEvent =
  | "message"
  | "message_edited"
  | "message_deleted"
  | "user_join"
  | "user_leave"
  | "notification"
  | "reaction_added"
  | "reaction_removed";

const listeners: Record<SocketEvent, Set<Listener>> = {
  message: new Set(),
  message_edited: new Set(),
  message_deleted: new Set(),
  user_join: new Set(),
  user_leave: new Set(),
  notification: new Set(),
  reaction_added: new Set(),
  reaction_removed: new Set(),
};

export const connectSocket = (token: string) => {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return socket;
  }

  socket = new WebSocket(`ws://localhost:8080/ws/chat?token=${token}`);

  socket.onopen = () => {
    console.log("✅ SOCKET CONNECTED");
  };

  socket.onclose = () => {
    console.log("❌ SOCKET CLOSED");
    socket = null;
  };

  socket.onerror = (err) => {
    console.error("SOCKET ERROR", err);
  };

  socket.onmessage = (event) => {
    try {
      const rawData = JSON.parse(event.data);
      const { type, ...restPayload } = rawData;

      const eventListeners = listeners[type as SocketEvent];

      if (!eventListeners) {
        console.warn("⚠️ UNKNOWN OR UNHANDLED SOCKET EVENT TYPE:", type);
        return;
      }

      // If backend nests inside data/payload, pass that; otherwise pass remaining properties
      const dataToDeliver = rawData.data ?? rawData.payload ?? restPayload;

      eventListeners.forEach((listener) => listener(dataToDeliver));
    } catch (err) {
      console.error("Failed to parse incoming socket message framework:", err);
    }
  };

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export const subscribe = (event: SocketEvent, callback: Listener) => {
  if (listeners[event]) {
    listeners[event].add(callback);
  }
};

export const unsubscribe = (event: SocketEvent, callback: Listener) => {
  if (listeners[event]) {
    listeners[event].delete(callback);
  }
};

export const emit = (data: any) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(data));
};