// api.ts
import axios from "axios"

export const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080"

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
})

// ─── ADD REQUEST INTERCEPTOR FOR JWT ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);