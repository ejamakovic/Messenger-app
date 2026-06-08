import { BrowserRouter, Routes, Route } from "react-router-dom";
// 1. Import ONLY the single, unified page component
import ChatDashboardPage from "./pages/ChatDashboardPage"; 
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
        <Route path="/" element={<ChatDashboardPage />} />
        <Route path="/chat/public" element={<ChatDashboardPage />} />                    
        <Route path="/chat/conversation/:conversationId" element={<ChatDashboardPage />} />          
        <Route path="/chat/user/:receiverUsername" element={<ChatDashboardPage />} />
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