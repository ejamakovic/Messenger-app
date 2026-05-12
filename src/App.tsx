import { BrowserRouter, Routes, Route }
from "react-router-dom"

import PublicChatPage
from "./pages/publicChatPage"

import PrivateChatPage
from "./pages/privateChatPage"

import { AuthProvider }
from "./context/AuthContext"

import { SocketProvider }
from "./context/SocketContext"

export default function App() {

  return (

    <AuthProvider>

      <SocketProvider>

        <BrowserRouter>

          <Routes>

            <Route
              path="/"
              element={<PublicChatPage />}
            />

            <Route
              path="/chat/:receiver"
              element={<PrivateChatPage />}
            />

          </Routes>

        </BrowserRouter>

      </SocketProvider>

    </AuthProvider>
  )
}