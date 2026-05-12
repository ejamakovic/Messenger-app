import { createContext, useContext, useEffect, useState } from "react"
import { getMe, login, type AuthResponse } from "../services/jwt.service"
import type { AuthContextType } from "../models/authContext"
import type { User } from "../models/user"

const createUsername = () => {
  const random = Math.random().toString(36).substring(2, 10)
  return `USER-${random}`
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true
})

export const AuthProvider = ({
  children
}: {
  children: React.ReactNode
}) => {

  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {

    const init = async () => {

      try {

        let storedUser = localStorage.getItem("user")

        let username: string

        if (storedUser) {
          username = JSON.parse(storedUser).username
        } else {

          username = createUsername()

          localStorage.setItem(
            "user",
            JSON.stringify({ username })
          )
        }

        let storedToken = localStorage.getItem("token")
        let res: AuthResponse

        if (storedToken) {

          try {

            res = await getMe()

          } catch {

            res = await login(username)

            localStorage.setItem(
              "token",
              res.token
            )
          }

        } else {

          res = await login(username)

          localStorage.setItem(
            "token",
            res.token
          )
        }

        setUser(res.user)
        setToken(res.token)

      } catch (err) {

        console.error("AUTH INIT ERROR", err)
      }

      setLoading(false)
    }

    init()

  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}