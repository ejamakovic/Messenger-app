import { createContext, useContext, useEffect, useState } from "react";
import { login, type AuthResponse } from "../services/jwt.service";
import type { AuthContextType } from "../models/authContext";
import type { User } from "../models/user";

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
});

const createUsername = () => {
  return `USER-${Math.random().toString(36).slice(2, 10)}`;
};

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {        
        const storedUser = sessionStorage.getItem("user");
        const storedToken = sessionStorage.getItem("token");

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          return;
        }
        
        const username = createUsername();

        const res: AuthResponse = await login(username);

        setUser(res.user);
        setToken(res.token);

        sessionStorage.setItem("user", JSON.stringify(res.user));
        sessionStorage.setItem("token", res.token);
      } catch (error) {
        console.error("AUTH ERROR:", error);

        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);