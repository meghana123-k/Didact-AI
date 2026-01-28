import axios, { AxiosError } from "axios";
import { User } from "../types"; 

const API_BASE_URL = "http://127.0.0.1:5001/api/auth";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authService = {
  async signup(
    name: string,
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post("/signup", { name, email, password });
      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<any>;
        if (!axiosError.response) {
          throw new Error(
            "Backend Unreachable. Ensure Flask is running on http://127.0.0.1:5001",
          );
        }
        throw new Error(axiosError.response.data.error || "Signup failed");
      }
      throw err;
    }
  },

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post("/login", { email, password });
      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<any>;
        if (!axiosError.response) {
          throw new Error(
            "Backend Unreachable. Ensure Flask is running on http://127.0.0.1:5001",
          );
        }
        throw new Error(axiosError.response.data.error || "Login failed");
      }
      throw err;
    }
  },

  async getMe(token: string): Promise<User> {
    try {
      const response = await api.get("/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err: any) {
      throw new Error("Profile retrieval failed");
    }
  },
};
