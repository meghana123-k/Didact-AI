import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }

    // Enhanced error messaging for debugging
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout - Backend may be slow or unresponsive");
      throw new Error(
        "Request timeout. Please check your network connection or try again later.",
      );
    }

    if (!error.response) {
      console.error("Network error - Cannot reach backend:", error.message);
      throw new Error(
        "Backend Unreachable. Please check your network connection or try again later. Error: " +
          error.message,
      );
    }

    return Promise.reject(error);
  },
);

export default api;
