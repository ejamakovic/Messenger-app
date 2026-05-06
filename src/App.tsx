import { BrowserRouter, Routes, Route } from "react-router-dom"
import PublicChatPage from "./pages/publicChatPage"
import PrivateChatPage from "./pages/privateChatPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicChatPage />} />
        <Route path="/chat/:receiver" element={<PrivateChatPage />} />
      </Routes>
    </BrowserRouter>
  )
}