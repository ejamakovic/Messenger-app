import { Routes, Route } from "react-router-dom"
import PublicChatPage from "./pages/publicChatPage"
import PrivateChatPage from "./pages/privateChatPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicChatPage />} />
      <Route path="/chat/:username" element={<PrivateChatPage />} />
    </Routes>
  )
}

export default App