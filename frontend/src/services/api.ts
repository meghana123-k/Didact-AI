import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5001/api",
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
        "Request timeout. Ensure Flask is running on http://127.0.0.1:5001",
      );
    }

    if (!error.response) {
      console.error("Network error - Cannot reach backend:", error.message);
      throw new Error(
        "Backend Unreachable. Ensure Flask is running on http://127.0.0.1:5001. Error: " +
          error.message,
      );
    }

    return Promise.reject(error);
  },
);

export default api;
