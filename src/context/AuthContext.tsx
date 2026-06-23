// AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { UserModel } from "../models/user";

type AuthContextType = {
  user: UserModel | null;
  token: string | null;
  loading: boolean;
  saveSession: (user: UserModel, token: string) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  saveSession: () => {},
  clearSession: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserModel | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const saveSession = (newUser: UserModel, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    sessionStorage.setItem("user", JSON.stringify(newUser));
    sessionStorage.setItem("token", newToken);
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
  };

  useEffect(() => {
    const initAuth = () => {
      try {        
        const storedUser = sessionStorage.getItem("user");
        const storedToken = sessionStorage.getItem("token");

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (error) {
        console.error("AUTH INIT ERROR:", error);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, saveSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);