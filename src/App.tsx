// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatDashboardPage from "./pages/Main/ChatDashboardPage"; 
import AuthPage from "./pages/Auth/AuthPage"; 
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import EditProfilePage from "./pages/Profile/EditProfilePage";
import ProfilePage from "./pages/Profile/ProfilePage";
import FeedPage from "./pages/Feed/FeedPage";
import PostDetailPage from "./pages/Post/PostDetailPage";

function AppRoutes() {
  // Grab both loading and user states from your context
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // ─── GATEWAY PROTECTION ──────────────────────────────────────────────────  
  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          {/* Catch any route path and serve the Auth page if unauthorized */}
          <Route path="*" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // ─── PROTECTED CHAT APPLICATION ROUTES ──────────────────────────────────
  return (
    <BrowserRouter>
      <Routes>       
        <Route path="/" element={<ChatDashboardPage />} />
        <Route path="/chat/public" element={<ChatDashboardPage />} />                    
        <Route path="/chat/conversation/:conversationId" element={<ChatDashboardPage />} />          
        <Route path="/chat/user/:receiverUsername" element={<ChatDashboardPage />} />

        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />

        {/* Optional fallback: if they type a random URL while logged in, go home */}
        <Route path="*" element={<ChatDashboardPage />} />                
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