// services/api.ts
import axios from "axios"

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080"

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(`${API_URL}/auth/refresh`, null, { withCredentials: true })
      .then((res) => {
        const { accessToken, user } = res.data
        sessionStorage.setItem("token", accessToken)
        if (user) sessionStorage.setItem("user", JSON.stringify(user))
        return accessToken as string
      })
      .catch(() => {
        sessionStorage.removeItem("token")
        sessionStorage.removeItem("user")
        return null
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const isAuthCall = original?.url?.startsWith("/auth/")

    if (error.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
      // refresh failed — force back to login
      window.location.href = "/"
    }
    return Promise.reject(error)
  }
)