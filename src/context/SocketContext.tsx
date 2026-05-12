import { createContext, useContext, useEffect} from "react"

import { connectSocket } from "../services/socket.service"
import { useAuth } from "./AuthContext"

const SocketContext = createContext(null)

export const SocketProvider = ({
  children
}: {
  children: React.ReactNode
}) => {

  const { token } = useAuth()

  useEffect(() => {

    if (!token) return

    connectSocket(token)

  }, [token])

  return (
    <SocketContext.Provider value={null}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  return useContext(SocketContext)
}