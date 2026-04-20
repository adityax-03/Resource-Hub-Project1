import axios from "axios";

/**
 * Centralized Axios instance for all API calls.
 *
 * In development: uses REACT_APP_API_URL (defaults to http://localhost:5001)
 * In production:  uses relative URLs (same origin — served from Express)
 */
const API_BASE = "https://resource-hub-project1.onrender.com";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json"
  }
});

// ── Request Interceptor: Attach JWT token automatically ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle auth errors globally ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and redirect
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export { API_BASE };
export default api;
