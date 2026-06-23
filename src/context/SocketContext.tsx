import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { connectSocket, disconnectSocket } from "../services/socket.service";

const SocketContext = createContext<any>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if we have a fully authenticated user context
    if (user) {
      const token = sessionStorage.getItem("token") || ""; 
      console.log("[SOCKET_CONTEXT] User active. Initializing socket connection...");
      
      connectSocket(token);
      setIsConnected(true);
    }

    return () => {
      if (user) {
        console.log("[SOCKET_CONTEXT] Disconnecting socket...");
        disconnectSocket();
        setIsConnected(false);
      }
    };
  }, [user]); // Reacts dynamically to login / logout states

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocketStatus = () => useContext(SocketContext);