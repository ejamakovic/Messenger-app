import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicChatPage from "./pages/publicChatPage";
import PrivateChatPage from "./pages/privateChatPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Default Landing or explicit Public Room view */}
        <Route path="/" element={<PublicChatPage />} />
        <Route path="/chat/public" element={<PublicChatPage />} />            

        <Route path="/chat/conversation/:conversationId" element={<PrivateChatPage />} />
        <Route path="/chat/user/:receiverUsername" element={<PrivateChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  );
}