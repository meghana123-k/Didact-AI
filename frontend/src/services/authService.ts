import axios, { AxiosError } from "axios";
import { User } from "../types";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/auth`;

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
            "Backend Unreachable. Please check your network connection or try again later.",
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
            "Backend Unreachable. Please check your network connection or try again later.",
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
